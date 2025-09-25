const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    features: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },
    status: { type: String, required: true, enum: ['active', 'inactive'] },
    percentage: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Packages = mongoose.model('Packages', PackageSchema);
module.exports = { Packages };
