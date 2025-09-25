const mongoose = require('mongoose');

const DepositRequestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    currency: { type: String, required: true },
    network: { type: String, required: true },
    address: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending', enum: ['completed', 'pending', 'failed', 'deleted'] },
    screenshot: { type: String, required: true },
    screenshotPublicId: { type: String },
    createdAt: { type: Date, default: Date.now },
});

const DepositRequest = mongoose.model('DepositRequest', DepositRequestSchema);
module.exports = { DepositRequest };