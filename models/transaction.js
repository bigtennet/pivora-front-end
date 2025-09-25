const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    currency: { type: String, required: true },
    network: { type: String, required: true, default: "TRC20" },
    amount: { type: Number, required: true },
    type: { type: String, required: true, enum: ['deposit', 'withdraw', 'admin_adjustment', 'referral_bonus', 'admin_deposit', 'swap'] },
    from: { type: String, required: false },
    to: { type: String, required: false },
    status: { type: String, required: true, enum: ['pending', 'completed', 'failed', 'deleted', 'success'] },
    createdAt: { type: Date, default: Date.now },
});

const Transaction = mongoose.model('Transaction', TransactionSchema);
module.exports = { Transaction };
