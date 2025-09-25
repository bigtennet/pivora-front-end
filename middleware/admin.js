const { Users } = require('../models/users');

const adminRequired = async (req, res, next) => {
    try {
        // Check if user exists and has admin role
        const user = await Users.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Debug logging
        console.log('Admin check - User ID:', req.user._id);
        console.log('Admin check - User from DB:', {
            _id: user._id,
            email: user.email,
            isAdmin: user.isAdmin,
            isAdminType: typeof user.isAdmin
        });

        // Check if user is admin
        if (user.isAdmin === true) {
            console.log('Admin access granted');
            req.adminUser = user;
            next();
        } else {
            console.log('Admin access denied - isAdmin:', user.isAdmin);
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

    } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

const superAdminRequired = async (req, res, next) => {
    try {
        const user = await Users.findById(req.user._id);
        if (!user || !user.isSuperAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Super admin access required' 
            });
        }
        next();
    } catch (error) {
        console.error('Super admin middleware error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

module.exports = { adminRequired, superAdminRequired }; 