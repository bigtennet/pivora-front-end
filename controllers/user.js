const { Users } = require('../models/users');
const { Balance } = require('../models/balance');
const { WithdrawRequest } = require('../models/withdraw');
const { DepositRequest } = require('../models/deposit');
const { Address } = require('../models/address');
const { Charges } = require('../models/charges');
const { Order } = require('../models/order');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinary');
const binanceAPI = require('../utils/binance');
const { Packages } = require('../models/packages');
const { Verification } = require('../models/verification');
const { Transaction } = require('../models/transaction');
require('dotenv').config();

// Deposit request
const getProfile = async (req, res) => {
    try {
        const user = await Users.findById(req.user._id, { password: 0 });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get all users referred by this user
        const referrals = await Users.find({ 
            referredBy: user.referralCode 
        }).select('email createdAt firstDeposit');

        // Create response with user data and referrals
        const userData = user.toObject();
        userData.referrals = referrals;

        return res.status(200).json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}


const createDepositRequest = async (req, res) => {
    try {
        const { user, currency, network, amount } = req.body;
        const screenshot = req.files?.screenshot;

        // Validate required fields
        if (!screenshot || !user || !currency || !network || !amount) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required: user, currency, network, amount, and screenshot' 
            });
        }

        // Validate file type (optional but recommended)
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(screenshot.mimetype)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' 
            });
        }

        // Check if user exists
        const userExists = await Users.findById(user);
        if (!userExists) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Get the address
        const depositAddress = await Address.findOne({ currency, network });
        if (!depositAddress) {
            return res.status(404).json({ 
                success: false, 
                message: 'Address not found for this currency and network' 
            });
        }

        // Get Deposit Charges
        // const fee = await Charges.findOne({ type: 'deposit' });

        let screenshotUrl = '';
        let screenshotPublicId = '';

        // Try to upload to Cloudinary, with fallback for testing
        try {
            // Upload screenshot to Cloudinary
            const uploadOptions = {
                folder: 'deposit-screenshots',
                transformation: [
                    { width: 800, height: 600, crop: 'limit' }, // Resize if too large
                    { quality: 'auto:good' } // Optimize quality
                ]
            };

            const screenshotResult = await uploadToCloudinary(screenshot.tempFilePath, uploadOptions);
            screenshotUrl = screenshotResult.secure_url;
            screenshotPublicId = screenshotResult.public_id;
        } catch (cloudinaryError) {
            console.warn('Cloudinary upload failed, using fallback:', cloudinaryError.message);
            
            // Fallback: Create a placeholder URL for testing
            // In production, you might want to store the file locally or use another service
            screenshotUrl = `https://via.placeholder.com/800x600/cccccc/666666?text=Deposit+Screenshot+(${Date.now()})`;
            screenshotPublicId = `fallback_${Date.now()}`;
            
            // Add a note that this is a fallback
            console.log('⚠️ Using fallback screenshot URL for testing purposes');
        }

        // Create deposit request
        const newDepositRequest = await DepositRequest.create({ 
            user, 
            currency, 
            network, 
            address: depositAddress.address,
            amount: parseFloat(amount), // Ensure it's a number
            screenshot: screenshotUrl,
            screenshotPublicId: screenshotPublicId,
            status: 'pending' // Add status field
        });

        // Populate user info for response (optional)
        // await newDepositRequest.populate('user', 'fullName email');

        return res.status(201).json({ 
            success: true, 
            message: 'Deposit request created successfully', 
            data: newDepositRequest 
        });

    } catch (error) {
        console.error('Error creating deposit request:', error);

        // Handle specific errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation error', 
                errors: error.errors 
            });
        }

        if (error.http_code) {
            // Cloudinary error
            return res.status(400).json({ 
                success: false, 
                message: 'File upload failed', 
                error: error.message 
            });
        }

        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};


const withdrawalRequest = async (req, res) => {
    try {
        const { currency, network, withdrawalAddress, amount, fundPassword="" } = req.body;

        // Check if user exists
        const user = req.user._id;
        const userExists = await Users.findById(user);
        if (!userExists) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (fundPassword !== userExists.fundPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid fund password' 
            });
        }

        // Find the user Balance
        const userBalance = await Balance.findOne({ user, currency, network });
        if (!userBalance || userBalance.amount < amount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Insufficient balance' 
            });
        }

        // Get Deposit Charges
        const fee = await Charges.findOne({ type: 'withdraw' });
        const finalAmount = fee ? amount * (1 - (fee.chargePercentage / 100)) : amount;

        // Create deposit request
        const newWithdrawRequest = await WithdrawRequest.create({ 
            user, 
            currency, 
            network, 
            finalAmount,
            amount,
            serviceCharge: fee ? (fee.chargePercentage / 100) : 0,
            address: withdrawalAddress,
        });

        return res.status(201).json({ 
            success: true, 
            message: 'Withdraw request created successfully', 
            data: newWithdrawRequest
        });

    } catch (error) {
        console.error('Error creating withdraw request:', error);

        // Handle specific errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation error', 
                errors: error.errors 
            });
        }

        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
}

const getDepositAddresses = async (req, res) => {
    const addresses = await Address.find({ type: 'deposit' });

    return res.status(200).json({
        success: true,
        data: addresses
    });
}

const getWithdrawalAddresses = async (req, res) => {
    const addresses = await Address.find({ type: 'withdraw' });

    return res.status(200).json({
        success: true,
        data: addresses
    });
}

const getBalances = async (req, res) => {
    // Ensure user has balances for USDT, USDC, BTC, ETH
    const requiredCurrencies = [
        { currency: 'USDT', network: 'Ethereum' },
        { currency: 'USDC', network: 'Ethereum' },
        { currency: 'BTC', network: 'Bitcoin' },
        { currency: 'ETH', network: 'Ethereum' }
    ];
    let balances = await Balance.find({ user: req.user._id });
    const existing = new Set(balances.map(b => b.currency));
    const toCreate = requiredCurrencies.filter(rc => !existing.has(rc.currency));
    if (toCreate.length > 0) {
        const newBalances = await Balance.insertMany(
            toCreate.map(rc => ({
                user: req.user._id,
                currency: rc.currency,
                network: rc.network,
                amount: 0
            }))
        );
        balances = balances.concat(newBalances);
    }
    return res.status(200).json({
        success: true,
        data: balances
    });
};

const getTransactionHistory = async (req, res) => {
    try {
        const [deposits, withdrawals] = await Promise.all([
            DepositRequest.find({ user: req.user._id }).sort({ createdAt: -1 }),
            WithdrawRequest.find({ user: req.user._id }).sort({ createdAt: -1 })
        ]);

        // Add transaction type and flatten
        const transactions = [
            ...deposits.map(deposit => ({
                ...deposit.toObject(),
                transactionType: 'deposit'
            })),
            ...withdrawals.map(withdrawal => ({
                ...withdrawal.toObject(),
                transactionType: 'withdrawal'
            }))
        ];

        // Sort by date (most recent first)
        transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.status(200).json({
            success: true,
            data: transactions,
            count: transactions.length
        });

    } catch (error) {
        console.error('Error fetching transaction history:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}

const getCharges = async (req, res) => {
    const charges = await Charges.find();

    return res.status(200).json({
        success: true,
        data: charges
    });
}

/**
 * Submit a futures trading order
 */
const submitOrder = async (req, res) => {
    try {
        console.log('🚀 Submit Order endpoint hit!');
        console.log('📝 Request body:', req.body);
        console.log('👤 User ID:', req.user._id);
        
        const { direction, ticker, duration, displayDuration, quantity } = req.body;
        const userId = req.user._id;
        let percentage = 0;

        // Validate required fields
        if (!direction || !ticker || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Both direction, ticker and duration are required'
            });
        }

        // Validate duration
        if (duration === '30s') {
            percentage = 40;
        } else if (duration === '60s') {
            percentage = 60;
        } else if (duration === '120s') {
            percentage = 120;
        } else if (duration === '300s') {
            percentage = 300;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid duration'
            });
        }

        // Validate direction
        if (!['long', 'short'].includes(direction)) {
            return res.status(400).json({
                success: false,
                message: 'Direction must be either "long" or "short"'
            });
        }

        // Validate ticker format (basic validation)
        if (!ticker.includes('/')) {
            return res.status(400).json({
                success: false,
                message: 'Ticker must be in format like "BTC/USDT"'
            });
        }

        // Check if user has sufficient balance
        const userBalance = await Balance.findOne({
            user: userId,
            currency: 'USDT' // Assuming USDT balance for trading
        });

        if (!userBalance || userBalance.amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient USDT balance for trading'
            });
        }

        // Get current price from Binance API
        let currentPrice;
        try {
            currentPrice = await binanceAPI.getCurrentPrice(ticker);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: `Failed to get current price for ${ticker}: ${error.message}`
            });
        }

        // Create the order
        const newOrder = await Order.create({
            user: userId,
            direction,
            ticker,
            entryPrice: currentPrice,
            currentPrice: currentPrice,
            percentage: percentage,
            quantity: quantity,
            action: 'profit',
            duration: duration,
            displayDuration: displayDuration,
            status: 'active'
        });

        // Populate user info for response
        await newOrder.populate('user', 'fullName email');

        console.log(`📊 New ${direction} order created for ${ticker} at $${currentPrice}`);

        return res.status(201).json({
            success: true,
            message: `${direction.toUpperCase()} order submitted successfully`,
            data: {
                orderId: newOrder._id,
                direction: newOrder.direction,
                ticker: newOrder.ticker,
                entryPrice: newOrder.entryPrice,
                currentPrice: newOrder.currentPrice,
                percentage: newOrder.percentage,
                duration: newOrder.duration,
                displayDuration: newOrder.displayDuration,
                status: newOrder.status,
                createdAt: newOrder.createdAt
            }
        });

    } catch (error) {
        console.error('Error submitting order:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * Get user's active orders
 */
const getActiveOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user._id,
            status: 'active'
        }).sort({ createdAt: -1 });

        // Calculate the time remaining for each order and update status if needed
        const ordersWithTimeRemaining = await Promise.all(orders.map(async (order) => {
            const value = parseInt(order.duration.slice(0, -1));
            const orderEndTime = new Date(order.createdAt.getTime() + (value * 1000)); // Convert seconds to milliseconds
            const currentTime = new Date();

            // Calculate time remaining in seconds
            let timeRemainingSeconds = Math.max(0, Math.floor((orderEndTime.getTime() - currentTime.getTime()) / 1000));

            // Check if order duration has expired
            if (orderEndTime <= currentTime) {
                console.log('Order expired, setting to pending_profit');
                const userBalance = await Balance.findOne({ user: order.user, currency: 'USDT' });

                order.status = 'closed';
                order.action = 'loss';
                order.amount = order.quantity;
                userBalance.amount -= order.amount;

                await userBalance.save();
                await order.save();
                timeRemainingSeconds = 0;
            }

            // Convert order to plain object and add time remaining
            const orderObj = order.toObject();
            orderObj.timeRemainingSeconds = timeRemainingSeconds;

            return orderObj;
        }));

        return res.status(200).json({
            success: true,
            data: ordersWithTimeRemaining,
            count: ordersWithTimeRemaining.length
        });

    } catch (error) {
        console.error('Error fetching active orders:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * Get user's order history
 */
const getOrderHistory = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user._id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: orders,
            count: orders.length
        });

    } catch (error) {
        console.error('Error fetching order history:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * Close an active order
 */
const closeOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({
            _id: orderId,
            user: userId,
            status: 'active'
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or already closed'
            });
        }

        // Get current price for final PnL calculation
        let currentPrice;
        try {
            currentPrice = await binanceAPI.getCurrentPrice(order.ticker);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: `Failed to get current price: ${error.message}`
            });
        }

        // Calculate final PnL
        const priceChange = currentPrice - order.entryPrice;
        const pnlPercent = (priceChange / order.entryPrice) * 100;
        
        let finalPnl = 0;
        if (order.direction === 'long') {
            finalPnl = pnlPercent > 0 ? pnlPercent : -Math.abs(pnlPercent);
        } else {
            finalPnl = pnlPercent < 0 ? Math.abs(pnlPercent) : -pnlPercent;
        }

        // Update order status
        order.status = 'closed';
        order.currentPrice = currentPrice;
        order.pnl = finalPnl;
        order.updatedAt = new Date();
        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Order closed successfully',
            data: {
                orderId: order._id,
                direction: order.direction,
                ticker: order.ticker,
                entryPrice: order.entryPrice,
                exitPrice: currentPrice,
                pnl: finalPnl,
                status: order.status
            }
        });

    } catch (error) {
        console.error('Error closing order:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * Swap coins endpoint
 * POST /api/user/swap
 * Body: { from: 'BTC', to: 'ETH', amount: 0.1 }
 */
const swapCoins = async (req, res) => {
    try {
        const userId = req.user._id;
        const { from, to, amount } = req.body;
        if (!from || !to || !amount || from === to) {
            return res.status(400).json({ success: false, message: 'Invalid swap parameters' });
        }
        // Find balances
        const fromBalance = await Balance.findOne({ user: userId, currency: from });
        const toBalance = await Balance.findOne({ user: userId, currency: to });
        if (!fromBalance || fromBalance.amount < amount) {
            return res.status(400).json({ success: false, message: `Insufficient ${from} balance` });
        }
        if (!toBalance) {
            return res.status(400).json({ success: false, message: `No ${to} balance found` });
        }
        // Get price from Binance
        const pair = `${from}${to}`;
        let price;
        let isDirectPair = true;
        
        console.log(`[SWAP DEBUG] Attempting to swap ${amount} ${from} to ${to}`);
        console.log(`[SWAP DEBUG] Trying direct pair: ${pair}`);
        
        try {
            price = await binanceAPI.getCurrentPrice(pair);
            console.log(`[SWAP DEBUG] Direct pair ${pair} price: ${price}`);
        } catch (e) {
            console.log(`[SWAP DEBUG] Direct pair ${pair} failed: ${e.message}`);
            // Try reverse pair
            try {
                const reversePair = `${to}${from}`;
                console.log(`[SWAP DEBUG] Trying reverse pair: ${reversePair}`);
                const reversePrice = await binanceAPI.getCurrentPrice(reversePair);
                console.log(`[SWAP DEBUG] Reverse pair ${reversePair} price: ${reversePrice}`);
                price = reversePrice;
                isDirectPair = false;
            } catch (err) {
                console.log(`[SWAP DEBUG] Reverse pair also failed: ${err.message}`);
                return res.status(400).json({ success: false, message: 'Unable to fetch price for swap' });
            }
        }
        
        console.log(`[SWAP DEBUG] Final price: ${price}, isDirectPair: ${isDirectPair}`);
        
        // Calculate amount to credit
        let toAmount;
        if (isDirectPair) {
            // Direct pair (e.g., BTCUSDT) - multiply by price
            toAmount = amount * price;
            console.log(`[SWAP DEBUG] Direct calculation: ${amount} * ${price} = ${toAmount}`);
        } else {
            // Reverse pair (e.g., BTCUSDT when swapping USDT to BTC) - divide by price
            toAmount = amount / price;
            console.log(`[SWAP DEBUG] Reverse calculation: ${amount} / ${price} = ${toAmount}`);
        }
        fromBalance.amount -= amount;
        toBalance.amount += toAmount;
        await fromBalance.save();
        await toBalance.save();

        // Create a transaction record
        const transaction = await Transaction.create({
            user: userId,
            type: 'swap',
            from: from,
            to: to,
            amount: amount,
            currency: from,
            network: 'TRC20',
            status: 'completed',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return res.status(200).json({
            success: true,
            message: `Swapped ${amount} ${from} to ${toAmount} ${to}`,
            data: {
                from,
                to,
                amountSwapped: amount,
                amountReceived: toAmount,
                price
            }
        });
    } catch (error) {
        console.error('Swap error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getSwapHistory = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id, type: 'swap' }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        console.error('Error fetching swap history:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Get all deposit requests for the logged-in user
const getDepositRequests = async (req, res) => {
    try {
        const deposits = await DepositRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: deposits,
            count: deposits.length
        });
    } catch (error) {
        console.error('Error fetching deposit requests:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get all withdrawal requests for the logged-in user
const getWithdrawalRequests = async (req, res) => {
    try {
        const withdrawals = await WithdrawRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: withdrawals,
            count: withdrawals.length
        });
    } catch (error) {
        console.error('Error fetching withdrawal requests:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getPackages = async (req, res) => {
    try {
        const packages = await Packages.find({ status: 'active' });
        return res.status(200).json({ success: true, data: packages });
    } catch (error) {
        console.error('Error fetching packages:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const getUserPackage = async (req, res) => {
    try {
        const user = await Users.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const package = await Packages.findById(user.package);
        if (!package) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }
        return res.status(200).json({ success: true, data: package });
    } catch (error) {
        console.error('Error fetching user package:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const enrollPackage = async (req, res) => {
    try {
        const { packageId } = req.body;
        const user = await Users.findById(req.user._id);
        const userBalance = await Balance.findOne({ user: req.user._id, currency: 'USDT' });

        const package = await Packages.findById(packageId);
        if (!package) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        if (!userBalance || userBalance.amount < package.price) {
            return res.status(400).json({ success: false, message: 'Insufficient balance' });
        }

        user.package = package._id;
        await user.save();
        return res.status(200).json({ success: true, message: 'Package enrolled successfully' });
    } catch (error) {
        console.error('Error enrolling package:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const advanceVerification = async (req, res) => {
    try {
        const { frontIdImage, backIdImage, selfieImage } = req.files;
        
        // Validate that at least one image is provided
        if (!frontIdImage && !backIdImage && !selfieImage) {
            return res.status(400).json({ 
                success: false, 
                message: 'At least one verification image is required' 
            });
        }

        // Validate file types
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const validateFile = (file) => {
            if (file && !allowedTypes.includes(file.mimetype)) {
                throw new Error(`Invalid file type for ${file.fieldname}. Only JPEG, PNG, and WebP images are allowed.`);
            }
        };

        validateFile(frontIdImage);
        validateFile(backIdImage);
        validateFile(selfieImage);

        const user = await Users.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.advanceVerification) {
            return res.status(400).json({ success: false, message: 'You already have a pending verification request' });
        }

        // Check if user already has a pending verification
        const existingVerification = await Verification.findOne({ 
            userId: user._id, 
            status: 'pending' 
        });
        
        if (existingVerification) {
            return res.status(400).json({ 
                success: false, 
                message: 'You already have a pending verification request' 
            });
        }

        // Upload images to Cloudinary
        const uploadOptions = {
            folder: 'verification-documents',
            transformation: [
                { width: 1200, height: 800, crop: 'limit' }, // Resize if too large
                { quality: 'auto:good' } // Optimize quality
            ]
        };

        let frontIdUrl = '';
        let backIdUrl = '';
        let selfieUrl = '';
        let frontIdPublicId = '';
        let backIdPublicId = '';
        let selfiePublicId = '';

        // Upload front ID image
        if (frontIdImage) {
            try {
                const frontIdResult = await uploadToCloudinary(frontIdImage.tempFilePath, uploadOptions);
                frontIdUrl = frontIdResult.secure_url;
                frontIdPublicId = frontIdResult.public_id;
            } catch (cloudinaryError) {
                console.error('Error uploading front ID image:', cloudinaryError);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to upload front ID image' 
                });
            }
        }

        // Upload back ID image
        if (backIdImage) {
            try {
                const backIdResult = await uploadToCloudinary(backIdImage.tempFilePath, uploadOptions);
                backIdUrl = backIdResult.secure_url;
                backIdPublicId = backIdResult.public_id;
            } catch (cloudinaryError) {
                console.error('Error uploading back ID image:', cloudinaryError);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to upload back ID image' 
                });
            }
        }

        // Upload selfie image
        if (selfieImage) {
            try {
                const selfieResult = await uploadToCloudinary(selfieImage.tempFilePath, uploadOptions);
                selfieUrl = selfieResult.secure_url;
                selfiePublicId = selfieResult.public_id;
            } catch (cloudinaryError) {
                console.error('Error uploading selfie image:', cloudinaryError);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to upload selfie image' 
                });
            }
        }

        // Create verification record
        const verification = await Verification.create({
            userId: user._id,
            frontIdImage: frontIdUrl,
            backIdImage: backIdUrl,
            selfieImage: selfieUrl,
            frontIdPublicId,
            backIdPublicId,
            selfiePublicId,
            status: 'pending'
        });

        return res.status(201).json({
            success: true,
            message: 'Verification documents submitted successfully',
            data: {
                verificationId: verification._id,
                status: verification.status,
                submittedAt: verification.createdAt
            }
        });

    } catch (error) {
        console.error('Error advancing verification:', error);
        
        if (error.message.includes('Invalid file type')) {
            return res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }

        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
}

const getVerificationStatus = async (req, res) => {
    try {
        const user = await Users.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const verification = await Verification.find({ userId: user._id });
        return res.status(200).json({ success: true, data: verification });
    } catch (error) {
        console.error('Error fetching verification status:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}


const updateFundPassword = async (req, res) => {
    try {
        const { fundPassword } = req.body;
        const user = await Users.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        user.fundPassword = fundPassword;
        await user.save();
        return res.status(200).json({ success: true, message: 'Fund password updated successfully' });
    } catch (error) {
        console.error('Error updating fund password:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = { 
    getDepositAddresses, 
    getWithdrawalAddresses, 
    getBalances, 
    getTransactionHistory, 
    createDepositRequest, 
    withdrawalRequest, 
    getCharges,
    getProfile,
    submitOrder,
    getActiveOrders,
    getOrderHistory,
    closeOrder,
    swapCoins,
    getDepositRequests,
    getWithdrawalRequests,
    getPackages,
    getUserPackage,
    enrollPackage,
    advanceVerification,
    getVerificationStatus,
    getSwapHistory,
    updateFundPassword
};


