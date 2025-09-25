const mongoose = require('mongoose');

const logsSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['warning', 'info', 'declined', 'success'],
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: false, // Some logs might not be user-specific
        index: true
    },
    action: {
        type: String,
        required: true,
        maxlength: 100
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String,
        maxlength: 45
    },
    userAgent: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Index for efficient querying
logsSchema.index({ createdAt: -1 });
logsSchema.index({ type: 1, createdAt: -1 });
logsSchema.index({ user: 1, createdAt: -1 });

const Logs = mongoose.model('Logs', logsSchema);

module.exports = { Logs }; 