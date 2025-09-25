const mongoose = require('mongoose');

const PriceTrackerSchema = new mongoose.Schema({
    ticker: { 
        type: String, 
        required: true,
        unique: true
    },
    currentPrice: { 
        type: Number, 
        required: true 
    },
    lastUpdated: { 
        type: Date, 
        default: Date.now 
    },
    priceHistory: [{
        price: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now }
    }]
});

// Keep only last 100 price entries to prevent excessive data growth
PriceTrackerSchema.pre('save', function(next) {
    if (this.priceHistory.length > 100) {
        this.priceHistory = this.priceHistory.slice(-100);
    }
    next();
});

const PriceTracker = mongoose.model('PriceTracker', PriceTrackerSchema);
module.exports = { PriceTracker }; 