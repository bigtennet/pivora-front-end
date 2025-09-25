const mongoose = require('mongoose');

const ChargesSchema = new mongoose.Schema({
    type: { type: String, required: true, enum: ['deposit', 'withdraw', 'convertion'] },
    chargePercentage: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Charges = mongoose.model('Charges', ChargesSchema);
module.exports = { Charges };