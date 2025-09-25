const mongoose = require('mongoose');

const WithdrawRequestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    currency: { type: String, required: true },
    network: { type: String, required: true },
    address: { type: String, required: true },
    amount: { type: Number, required: true },
    serviceCharge: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
    status: { type: String, default: 'pending', enum: ['completed', 'pending', 'failed', 'deleted'] },
    createdAt: { type: Date, default: Date.now },
});

const WithdrawRequest = mongoose.model('WithdrawRequest', WithdrawRequestSchema);
module.exports = { WithdrawRequest };