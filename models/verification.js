const mongoose = require('mongoose');

const VerificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    frontIdImage: { type: String, required: false },
    backIdImage: { type: String, required: false },
    selfieImage: { type: String, required: false },
    frontIdPublicId: { type: String, required: false },
    backIdPublicId: { type: String, required: false },
    selfiePublicId: { type: String, required: false },
    status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Verification = mongoose.model('Verification', VerificationSchema);
module.exports = { Verification };
