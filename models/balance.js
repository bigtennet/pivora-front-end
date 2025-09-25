const mongoose = require('mongoose');

const BalanceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    currency: { type: String, required: true },
    amount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Balance = mongoose.model('Balance', BalanceSchema);
module.exports = { Balance };