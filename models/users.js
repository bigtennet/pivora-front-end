const mongoose = require('mongoose');

const UsersSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fundPassword: { type: String, required: false },
    referralCode: { type: String, required: false },
    referredBy: { type: String, required: false },
    firstDeposit: { type: Boolean, default: false },
    status: { type: String, default: 'active', enum: ['active', 'inactive', 'suspended'] },
    emailVerified: { type: Boolean, default: false },
    advanceVerification: { type: Boolean, default: false },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Packages', required: false },
    isAdmin: { type: Boolean, default: false },
    isSuperAdmin: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    suspendReason: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    lastLogin: {type: Date, required: false}
});

const Users = mongoose.model('Users', UsersSchema);
module.exports = { Users };
