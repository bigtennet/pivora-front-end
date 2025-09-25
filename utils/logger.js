const { Logs } = require('../models/logs');

/**
 * Log utility function to store logs in database
 * @param {Object} options - Logging options
 * @param {string} options.type - Log type: 'warning', 'info', 'declined', 'success'
 * @param {string} options.message - Log message
 * @param {string} options.action - Action being performed
 * @param {Object} options.user - User object (optional)
 * @param {Object} options.details - Additional details (optional)
 * @param {string} options.ipAddress - IP address (optional)
 * @param {string} options.userAgent - User agent (optional)
 */
const logActivity = async ({
    type,
    message,
    action,
    user = null,
    details = {},
    ipAddress = null,
    userAgent = null
}) => {
    try {
        const logData = {
            type,
            message,
            action,
            details,
            ipAddress,
            userAgent
        };

        // Add user ID if user object is provided
        if (user && user._id) {
            logData.user = user._id;
        }

        // Validate required fields
        if (!type || !message || !action) {
            console.error('Logging failed: Missing required fields', { type, message, action });
            return;
        }

        // Validate type
        const validTypes = ['warning', 'info', 'declined', 'success'];
        if (!validTypes.includes(type)) {
            console.error('Logging failed: Invalid type', { type });
            return;
        }

        // Create log entry
        await Logs.create(logData);
        
        // Also log to console for development
        const timestamp = new Date().toISOString();
        const userInfo = user ? `[User: ${user.email || user._id}]` : '[System]';
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${userInfo} ${action}: ${message}`);
        
    } catch (error) {
        console.error('Error creating log entry:', error);
        // Don't throw error to prevent breaking the main functionality
    }
};

/**
 * Convenience functions for different log types
 */
const logInfo = async (message, action, options = {}) => {
    await logActivity({ type: 'info', message, action, ...options });
};

const logSuccess = async (message, action, options = {}) => {
    await logActivity({ type: 'success', message, action, ...options });
};

const logWarning = async (message, action, options = {}) => {
    await logActivity({ type: 'warning', message, action, ...options });
};

const logDeclined = async (message, action, options = {}) => {
    await logActivity({ type: 'declined', message, action, ...options });
};

module.exports = {
    logActivity,
    logInfo,
    logSuccess,
    logWarning,
    logDeclined
}; 