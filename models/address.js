const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    currency: { type: String, required: true },
    network: { type: String, required: true },
    address: { type: String, required: true },
    type: { type: String, required: true, enum: ['deposit', 'withdraw'] },
    qrImage: { type: String, required: false },
    qrImagePublicId: { type: String, required: false },

    createdAt: { type: Date, default: Date.now },
});

const Address = mongoose.model('Address', AddressSchema);
module.exports = { Address };