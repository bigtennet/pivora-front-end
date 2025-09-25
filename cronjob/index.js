const cron = require('node-cron');
const { Order } = require('../models/order');
const { PriceTracker } = require('../models/price-tracker');
const { Balance } = require('../models/balance');
const binanceAPI = require('../utils/binance');

class PriceTrackingCron {
    constructor() {
        this.isRunning = false;
    }

    /**
     * Initialize the cron job
     */
    init() {
        console.log('🚀 Initializing Price Tracking Cron Job...');
        
        // Run every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            if (this.isRunning) {
                console.log('⏳ Previous cron job still running, skipping...');
                return;
            }
            
            this.isRunning = true;
            console.log('📊 Starting price tracking cron job...');
            
            try {
                await this.processPriceTracking();
                console.log('✅ Price tracking cron job completed successfully');
            } catch (error) {
                console.error('❌ Error in price tracking cron job:', error);
            } finally {
                this.isRunning = false;
            }
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        console.log('✅ Price tracking cron job scheduled (every 5 minutes)');
    }

    /**
     * Main process for price tracking and PnL calculation
     */
    async processPriceTracking() {
        try {
            // Get all active orders
            const activeOrders = await Order.find({ status: 'active' }).populate('user');
            
            if (activeOrders.length === 0) {
                console.log('📝 No active orders found');
                return;
            }

            console.log(`📊 Processing ${activeOrders.length} active orders`);

            // Get unique tickers from active orders
            const uniqueTickers = [...new Set(activeOrders.map(order => order.ticker))];
            
            // Update prices for all unique tickers
            const priceUpdates = {};
            for (const ticker of uniqueTickers) {
                try {
                    const currentPrice = await binanceAPI.getCurrentPrice(ticker);
                    priceUpdates[ticker] = currentPrice;
                    
                    // Update price tracker
                    await this.updatePriceTracker(ticker, currentPrice);
                    
                    console.log(`💰 ${ticker}: $${currentPrice}`);
                } catch (error) {
                    console.error(`❌ Failed to get price for ${ticker}:`, error.message);
                }
            }

            // Process each order
            for (const order of activeOrders) {
                try {
                    const currentPrice = priceUpdates[order.ticker];
                    if (!currentPrice) {
                        console.log(`⚠️ Skipping order ${order._id} - no price data for ${order.ticker}`);
                        continue;
                    }

                    await this.processOrder(order, currentPrice);
                } catch (error) {
                    console.error(`❌ Error processing order ${order._id}:`, error.message);
                }
            }

        } catch (error) {
            console.error('❌ Error in processPriceTracking:', error);
            throw error;
        }
    }

    /**
     * Update price tracker for a specific ticker
     */
    async updatePriceTracker(ticker, price) {
        try {
            await PriceTracker.findOneAndUpdate(
                { ticker },
                {
                    $set: { 
                        currentPrice: price,
                        lastUpdated: new Date()
                    },
                    $push: {
                        priceHistory: {
                            price: price,
                            timestamp: new Date()
                        }
                    }
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error(`❌ Error updating price tracker for ${ticker}:`, error);
        }
    }

    /**
     * Process individual order and calculate PnL
     */
    async processOrder(order, currentPrice) {
        try {
            const entryPrice = order.entryPrice;
            const direction = order.direction;

            // Calculate price change percentage
            const priceChangePercent = ((currentPrice - entryPrice) / entryPrice) * 100;

            // Determine if order is profitable based on direction
            let isProfitable = false;
            if (direction === 'long') {
                isProfitable = currentPrice > entryPrice;
            } else if (direction === 'short') {
                isProfitable = currentPrice < entryPrice;
            }

            // Calculate PnL adjustment (0.1% of user balance)
            const userBalance = await Balance.findOne({ 
                user: order.user._id,
                currency: 'USDT' // Assuming USDT balance for simplicity
            });

            if (!userBalance) {
                console.log(`⚠️ No USDT balance found for user ${order.user._id}`);
                return;
            }

            const balanceAmount = userBalance.amount;
            const pnlAdjustment = balanceAmount * 0.001; // 0.1%

            // Update user balance based on profitability
            if (isProfitable) {
                // Add 0.1% to balance
                await Balance.findByIdAndUpdate(
                    userBalance._id,
                    { $inc: { amount: pnlAdjustment } }
                );
                console.log(`✅ User ${order.user.email} gained ${pnlAdjustment} USDT (Long: ${direction === 'long'}, Price: ${currentPrice} > ${entryPrice})`);
            } else {
                // Subtract 0.1% from balance
                await Balance.findByIdAndUpdate(
                    userBalance._id,
                    { $inc: { amount: -pnlAdjustment } }
                );
                console.log(`❌ User ${order.user.email} lost ${pnlAdjustment} USDT (Long: ${direction === 'long'}, Price: ${currentPrice} < ${entryPrice})`);
            }

            // Update order with current price and PnL
            const newPnl = isProfitable ? pnlAdjustment : -pnlAdjustment;
            await Order.findByIdAndUpdate(
                order._id,
                {
                    currentPrice: currentPrice,
                    pnl: newPnl,
                    status: 'closed',
                    updatedAt: new Date()
                }
            );

        } catch (error) {
            console.error(`❌ Error processing order ${order._id}:`, error);
            throw error;
        }
    }

    /**
     * Manual trigger for testing
     */
    async manualTrigger() {
        console.log('🔧 Manual trigger initiated...');
        // await this.processPriceTracking();
    }
}

module.exports = new PriceTrackingCron(); 