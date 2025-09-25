const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    direction: { 
        type: String, 
        required: true, 
        enum: ['long', 'short'] 
    },
    ticker: { 
        type: String, 
        required: true,
        default: 'BTC/USDT'
    },
    entryPrice: { 
        type: Number, 
        required: true 
    },
    currentPrice: { 
        type: Number, 
        default: 0 
    },
    status: { 
        type: String, 
        default: 'active',
        enum: ['active', 'closed', 'cancelled', 'pending_profit']
    },
    pnl: { 
        type: Number, 
        default: 0 
    },
    percentage: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }, // Amount to receive or deduct from user balance
    duration: { type: String, default: '30s' },
    displayDuration: { type: Date, default: Date.now },
    action: { type: String, default: 'profit' }, // profit or loss
    quantity: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
OrderSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Order = mongoose.model('Order', OrderSchema);
module.exports = { Order }; 