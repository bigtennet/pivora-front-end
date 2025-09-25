const { Users } = require('../models/users');
const { Balance } = require('../models/balance');
const { WithdrawRequest } = require('../models/withdraw');
const { DepositRequest } = require('../models/deposit');
const { Address } = require('../models/address');
const { Charges } = require('../models/charges');
const { Transaction } = require('../models/transaction');
const { Packages } = require('../models/packages');
const { Logs } = require('../models/logs');
const { Order } = require('../models/order');
const { logActivity, logSuccess, logWarning, logDeclined } = require('../utils/logger');
const { Verification } = require('../models/verification');
const binanceAPI = require('../utils/binance');
const { v4: uuidv4 } = require('uuid');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinary');

require('dotenv').config();

const getDepositRequests = async (req, res) => {
    const { user, currency, network, status } = req.query;

    const validStatus = ['pending', 'completed', 'failed'];

    // Validate status if provided
    if (status && !validStatus.includes(status)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid status. Valid options: pending, completed, failed' 
        });
    }

    try {
        // Build filter object
        const filter = {};

        // If status is provided, filter by it; otherwise exclude 'deleted' status
        if (status) {
            filter.status = status;
        } else {
            filter.status = { $ne: 'deleted' }; // Exclude deleted deposits
        }

        // Add additional filters from query params
        if (user) filter.user = user;
        if (currency) filter.currency = currency;
        if (network) filter.network = network;

        // Fetch deposit requests
        const depositRequests = await DepositRequest.find(filter)
            .populate('user', 'fullName email') // Populate user details
            .sort({ createdAt: -1 }); // Most recent first

        return res.status(200).json({
            success: true,
            data: depositRequests,
            count: depositRequests.length,
            filters: {
                status: status || 'all',
                user,
                currency,
                network
            }
        });

    } catch (error) {
        console.error('Error fetching deposit requests:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching deposit requests' 
        });
    }
}

const getWithdrawRequests = async (req, res) => {
    const { user, currency, network, status } = req.query;

    const validStatus = ['pending', 'completed', 'failed'];

    // Validate status if provided
    if (status && !validStatus.includes(status)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid status. Valid options: pending, completed, failed' 
        });
    }

    try {
        // Build filter object
        const filter = {};

        // If status is provided, filter by it; otherwise exclude 'deleted' status
        if (status) {
            filter.status = status;
        } else {
            filter.status = { $ne: 'deleted' }; // Exclude deleted deposits
        }

        // Add additional filters from query params
        if (user) filter.user = user;
        if (currency) filter.currency = currency;
        if (network) filter.network = network;

        // Fetch deposit requests
        const withdrawRequests = await WithdrawRequest.find(filter)
            .populate('user', 'fullName email') // Populate user details
            .sort({ createdAt: -1 }); // Most recent first

        return res.status(200).json({
            success: true,
            data: withdrawRequests,
            count: withdrawRequests.length,
            filters: {
                status: status || 'all',
                user,
                currency,
                network
            }
        });

    } catch (error) {
        console.error('Error fetching deposit requests:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching deposit requests' 
        });
    }
}


// Update deposit request status
const updateDepositRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatus = ['pending', 'completed', 'failed', 'deleted'];

    if (!status || !validStatus.includes(status)) {
        return res.status(400).json({ 
            success: false, 
            message: `Invalid status. Valid options: ${validStatus.join(', ')}` 
        });
    }

    try {
        const depositRequest = await DepositRequest.findById(id).populate('user');
        
        if (!depositRequest) {
            return res.status(404).json({ 
                success: false, 
                message: 'Deposit request not found' 
            });
        }

        const oldStatus = depositRequest.status;
        
        // Update deposit request status
        depositRequest.status = status;
        await depositRequest.save();

        // Update user balance if status changed to completed
        if (status === 'completed' && oldStatus !== 'completed') {
            if (!depositRequest.user.firstDeposit) {
                depositRequest.user.firstDeposit = true;
                await depositRequest.user.save();
                const bonus  = depositRequest.amount * (1 + 0.01); // 1% bonus
                await updateUserBalance({
                    userId: depositRequest.user._id,
                    currency: depositRequest.currency,
                    network: depositRequest.network,
                    amount: bonus,
                    operation: 'add',
                    type: 'deposit',
                    status: 'completed'
                });
                if (depositRequest.user.referredBy) {
                    const referredUser = await Users.findOne({ referralCode: depositRequest.user.referredBy });
                    if (referredUser) {
                        const bonus = depositRequest.amount * 0.01; // 1% bonus
                        await updateUserBalance({
                            userId: referredUser._id,
                            currency: depositRequest.currency,
                            network: depositRequest.network,
                            amount: bonus,
                            operation: 'add',
                            type: 'referral_bonus',
                            status: 'success'
                        });
                    }
                }
            } else {
                await updateUserBalance({
                    userId: depositRequest.user._id,
                    currency: depositRequest.currency,
                    network: depositRequest.network,
                    amount: depositRequest.amount,
                    operation: 'add',
                    type: 'deposit',
                    status: 'completed'
                });
            }
        }
        
        // Reverse balance if status changed from completed to failed/deleted
        if ((status === 'failed' || status === 'deleted') && oldStatus === 'completed') {
            await updateUserBalance({
                userId: depositRequest.user._id,
                currency: depositRequest.currency,
                network: depositRequest.network,
                amount: depositRequest.amount,
                operation: 'subtract',
                type: 'deposit',
                status
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Deposit request status updated successfully',
            data: depositRequest
        });

    } catch (error) {
        console.error('Error updating deposit request status:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Update withdraw request status
const updateWithdrawRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatus = ['pending', 'completed', 'failed', 'deleted'];

    if (!status || !validStatus.includes(status)) {
        return res.status(400).json({ 
            success: false, 
            message: `Invalid status. Valid options: ${validStatus.join(', ')}` 
        });
    }

    try {
        const withdrawRequest = await WithdrawRequest.findById(id).populate('user');
        
        if (!withdrawRequest) {
            return res.status(404).json({ 
                success: false, 
                message: 'Withdraw request not found' 
            });
        }

        const oldStatus = withdrawRequest.status;
        
        // Update withdraw request status
        withdrawRequest.status = status;
        await withdrawRequest.save();

        // If status changed from pending to failed, refund the amount to user
        if (status === 'failed' && oldStatus === 'pending') {
            await updateUserBalance({
                userId: withdrawRequest.user._id,
                currency: withdrawRequest.currency,
                network: withdrawRequest.network,
                amount: withdrawRequest.amount,
                operation: 'add',
                type: 'withdraw',
                status: 'failed'
            });
        }
        // If status changed from failed back to pending, deduct the amount again
        if (status === 'pending' && oldStatus === 'failed') {
            await updateUserBalance({
                userId: withdrawRequest.user._id,
                currency: withdrawRequest.currency,
                network: withdrawRequest.network,
                amount: withdrawRequest.amount,
                operation: 'subtract',
                type: 'withdraw',
                status: 'pending'
            });
        }
        // If status changed from pending to completed, deduct the amount
        if (status === 'completed' && oldStatus === 'pending') {
            await updateUserBalance({
                userId: withdrawRequest.user._id,
                currency: withdrawRequest.currency,
                network: withdrawRequest.network,
                amount: withdrawRequest.amount,
                operation: 'subtract',
                type: 'withdraw',
                status: 'completed'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Withdraw request status updated successfully',
            data: withdrawRequest
        });

    } catch (error) {
        console.error('Error updating withdraw request status:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Helper function to update user balance
const updateUserBalance = async ({
    userId,
    currency,
    network = "",
    reason = "",
    amount,
    operation,
    type = 'admin_adjustment',
    status = 'success'
}) => {
    try {
        let balance = await Balance.findOne({ user: userId, currency});
        console.log(balance);
        console.log(userId, currency, network, reason, amount, operation, type, status);
        
        if (!balance) {
            // Create new balance record if it doesn't exist
            console.log('Creating new balance record');
            balance = new Balance({
                user: userId,
                currency,
                amount: operation === 'add' ? amount : 0
            });
        } else {
            // Update existing balance
            console.log('Updating existing balance');
            if (operation === 'add') {
                console.log('Adding amount');
                balance.amount += parseFloat(amount);
            } else if (operation === 'subtract') {
                console.log('Subtracting amount');
                balance.amount = Math.max(0, balance.amount - parseFloat(amount));
            }
        }

        // console.log(balance);
        
        await balance.save();
        // Record transaction history
        await Transaction.create({
            user: userId,
            currency: currency.toUpperCase(),
            network: network ? network.toUpperCase() : "TRC20",
            amount: parseFloat(amount),
            type,
            status,
            reason
        });
        return balance;
    } catch (error) {
        console.error('Error updating user balance:', error);
        throw error;
    }
};

// Get Transactions History
const getTransactionHistory = async (req, res) => {
    const { type, status, currency, user } = req.query;

    try {
        // Build filter object
        const filter = { status: { $ne: 'deleted' } }; // Exclude deleted by default
        
        if (status) filter.status = status;
        if (currency) filter.currency = currency;
        if (user) filter.user = user;

        let deposits = [];
        let withdrawals = [];
        let adminDeposits = [];
        // Fetch based on type filter
        if (!type || type === 'deposit') {
            deposits = await DepositRequest.find(filter)
                .populate('user', 'fullName email')
                .sort({ createdAt: -1 });
        }

        if (!type || type === 'withdrawal') {
            withdrawals = await WithdrawRequest.find(filter)
                .populate('user', 'fullName email')
                .sort({ createdAt: -1 });
        }

        if (!type || type === 'admin_deposit') {
            filter.type = 'admin_deposit';
            adminDeposits = await Transaction.find(filter)
                .populate('user', 'fullName email')
                .sort({ createdAt: -1 });
        }

        // Combine and add transaction types
        const transactions = [
            ...deposits.map(deposit => ({
                ...deposit.toObject(),
                transactionType: 'deposit'
            })),
            ...withdrawals.map(withdrawal => ({
                ...withdrawal.toObject(),
                transactionType: 'withdrawal'
            })),
            ...adminDeposits.map(adminDeposit => ({
                ...adminDeposit.toObject(),
                transactionType: 'admin_deposit'
            }))
        ];

        // Sort by date (most recent first)
        transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.status(200).json({
            success: true,
            data: transactions,
            count: transactions.length,
            filters: { type, status, currency, user }
        });

    } catch (error) {
        console.error('Error fetching transaction history:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Get Total Balance (Platform's total balance)
const getTotalBalance = async (req, res) => {
    try {
        // Get total balance grouped by currency
        const balancesByCurrency = await Balance.aggregate([
            {
                $group: {
                    _id: '$currency',
                    totalAmount: { $sum: '$amount' },
                    userCount: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Get overall total (assuming all amounts are in same base unit)
        const grandTotal = await Balance.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalUsers: { $sum: 1 }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                byCurrency: balancesByCurrency,
                grandTotal: grandTotal[0] || { totalAmount: 0, totalUsers: 0 }
            }
        });

    } catch (error) {
        console.error('Error fetching total balance:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Get Users
const getUsers = async (req, res) => {
    const { email, status } = req.query;

    try {
        // Build filter object
        const filter = {};
        // console.log(status);
        if (status) filter.status = status;
        if (email) {
            filter.email = { $regex: email, $options: 'i' }; // Case insensitive search
        }

        const users = await Users.find(filter)
            .select('-password -refreshToken') // Exclude sensitive fields
            .sort({ createdAt: -1 });

        // For each user, calculate total balance in USDT
        const userData = await Promise.all(users.map(async user => {
            const balances = await Balance.find({ user: user._id });
            let totalUSDT = 0;
            for (const bal of balances) {
                if (bal.currency === 'USDT') {
                    totalUSDT += bal.amount;
                } else {
                    try {
                        const pair = `${bal.currency}USDT`;
                        const price = await binanceAPI.getCurrentPrice(pair);
                        totalUSDT += bal.amount * price;
                    } catch (e) {
                        // If price fetch fails, skip this balance
                        continue;
                    }
                }
            }
            return { ...user.toObject(), totalBalanceUSDT: totalUSDT };
        }));

        return res.status(200).json({
            success: true,
            data: userData,
            count: userData.length
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Get deposit addresses
const getDepositAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ type: 'deposit' });

        return res.status(200).json({
            success: true,
            data: addresses
        });
    } catch (error) {
        console.error('Error fetching deposit addresses:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Get withdrawal addresses
const getWithdrawalAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ type: 'withdraw' });

        return res.status(200).json({
            success: true,
            data: addresses
        });
    } catch (error) {
        console.error('Error fetching withdrawal addresses:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Get charges
const getCharges = async (req, res) => {
    try {
        const charges = await Charges.find();

        return res.status(200).json({
            success: true,
            data: charges
        });
    } catch (error) {
        console.error('Error fetching charges:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Update/Add addresses
const updateAddresses = async (req, res) => {
    const { network, currency, address, type } = req.body;
    // console.log("Files", req.files);
    
    const qrImage = req.files ? req.files.qrImage : null;

    if (!network || !currency || !address || !type) {
        await logWarning(
            'Address update failed: Missing required fields',
            'address_update',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({
            success: false,
            message: 'Network, currency, address, and type are required'
        });
    }

    const validTypes = ['deposit', 'withdraw'];
    if (!validTypes.includes(type)) {
        await logWarning(
            `Address update failed: Invalid type - ${type}`,
            'address_update',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({
            success: false,
            message: `Invalid type. Valid options: ${validTypes.join(', ')}`
        });
    }

    try {
        let cloudinaryResult = null;
        
        // Upload QR image to Cloudinary if provided
        console.log('🔍 File Upload Debug:');
        console.log('req.files:', req.files);
        console.log('qrImage object:', qrImage);
        
        if (qrImage) {
            try {
                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(qrImage.mimetype)) {
                    await logWarning(
                        `QR image upload failed: Invalid file type - ${qrImage.mimetype}`,
                        'address_update',
                        { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
                    );
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
                    });
                }

                // Validate file size (max 5MB)
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (qrImage.size > maxSize) {
                    await logWarning(
                        `QR image upload failed: File too large - ${qrImage.size} bytes`,
                        'address_update',
                        { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
                    );
                    return res.status(400).json({
                        success: false,
                        message: 'File too large. Maximum size is 5MB.'
                    });
                }

                const uploadOptions = {
                    folder: 'Pivora Trading/qr-codes',
                    resource_type: 'image',
                    public_id: `${currency}_${network}_${type}_${Date.now()}`,
                    overwrite: true,
                    transformation: [
                        { width: 300, height: 300, crop: 'limit', quality: 'auto' }
                    ]
                };
                
                // Use tempFilePath directly (this is how express-fileupload works)
                const filePath = qrImage.tempFilePath;
                console.log('Selected file path:', filePath);
                console.log('File object properties:', {
                    tempFilePath: qrImage.tempFilePath,
                    name: qrImage.name,
                    size: qrImage.size,
                    mimetype: qrImage.mimetype
                });
                
                // Check if file exists
                const fs = require('fs');
                if (!fs.existsSync(filePath)) {
                    throw new Error(`File not found at path: ${filePath}`);
                }
                
                cloudinaryResult = await uploadToCloudinary(filePath, uploadOptions);
                console.log('QR image uploaded to Cloudinary:', cloudinaryResult.secure_url);
                
                // Clean up temp file
                try {
                    fs.unlinkSync(filePath);
                    console.log('Temp file cleaned up:', filePath);
                } catch (cleanupError) {
                    console.warn('Failed to clean up temp file:', cleanupError.message);
                }
            } catch (cloudinaryError) {
                console.error('Error uploading QR image to Cloudinary:', cloudinaryError);
                await logWarning(
                    `QR image upload failed: ${cloudinaryError.message}`,
                    'address_update',
                    { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
                );
                // Continue without QR image if upload fails
            }
        }

        // Check if address with same network and currency already exists
        const existingAddress = await Address.findOne({ network, currency, type });

        if (existingAddress) {
            // Update existing address
            const oldAddress = existingAddress.address;
            const oldQrImage = existingAddress.qrImage;
            
            existingAddress.address = address;
            
            // Update QR image if new one was uploaded
            if (cloudinaryResult) {
                existingAddress.qrImage = cloudinaryResult.secure_url;
                existingAddress.qrImagePublicId = cloudinaryResult.public_id;
                
                // Delete old QR image from Cloudinary if it exists
                if (oldQrImage && existingAddress.qrImagePublicId) {
                    try {
                        await deleteFromCloudinary(existingAddress.qrImagePublicId);
                        console.log('Old QR image deleted from Cloudinary');
                    } catch (deleteError) {
                        console.error('Error deleting old QR image:', deleteError);
                    }
                }
            }
            
            await existingAddress.save();

            // Log successful update
            await logSuccess(
                `Address updated: ${currency} (${network}) - ${type}`,
                'address_update',
                { 
                    user: req.user, 
                    details: { 
                        addressId: existingAddress._id,
                        currency,
                        network,
                        type,
                        oldAddress,
                        newAddress: address,
                        qrImageUploaded: !!cloudinaryResult,
                        qrImageUrl: cloudinaryResult?.secure_url,
                        updatedAt: new Date()
                    },
                    ipAddress: req.ip, 
                    userAgent: req.get('User-Agent') 
                }
            );

            return res.status(200).json({
                success: true,
                message: 'Address updated successfully',
                data: existingAddress
            });
        } else {
            // Create new address
            const addressData = {
                network,
                currency,
                address,
                type
            };
            
            // Add QR image data if uploaded successfully
            if (cloudinaryResult) {
                addressData.qrImage = cloudinaryResult.secure_url;
                addressData.qrImagePublicId = cloudinaryResult.public_id;
            }
            
            const newAddress = await Address.create(addressData);

            // Log successful creation
            await logSuccess(
                `Address created: ${currency} (${network}) - ${type}`,
                'address_create',
                { 
                    user: req.user, 
                    details: { 
                        addressId: newAddress._id,
                        currency,
                        network,
                        type,
                        address,
                        qrImageUploaded: !!cloudinaryResult,
                        qrImageUrl: cloudinaryResult?.secure_url,
                        createdAt: new Date()
                    },
                    ipAddress: req.ip, 
                    userAgent: req.get('User-Agent') 
                }
            );

            return res.status(201).json({
                success: true,
                message: 'Address created successfully',
                data: newAddress
            });
        }

    } catch (error) {
        console.error('Error updating/creating address:', error);
        await logWarning(
            `Address update/creation error: ${error.message}`,
            'address_update',
            { 
                user: req.user, 
                details: { error: error.message, stack: error.stack },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Delete address
const deleteAddress = async (req, res) => {
    const { addressId } = req.params;

    if (!addressId) {
        return res.status(400).json({
            success: false,
            message: 'Address ID is required'
        });
    }

    try {
        // Check if address exists
        const address = await Address.findById(addressId);
        
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Check if address is being used in any pending transactions
        const pendingDeposits = await DepositRequest.find({ 
            currency: address.currency, 
            network: address.network, 
            status: 'pending' 
        });

        const pendingWithdrawals = await WithdrawRequest.find({ 
            currency: address.currency, 
            network: address.network, 
            status: 'pending' 
        });

        if (pendingDeposits.length > 0 || pendingWithdrawals.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete address. There are ${pendingDeposits.length} pending deposits and ${pendingWithdrawals.length} pending withdrawals using this address.`
            });
        }

        // Delete QR image from Cloudinary if it exists
        if (address.qrImagePublicId) {
            try {
                await deleteFromCloudinary(address.qrImagePublicId);
                console.log('QR image deleted from Cloudinary:', address.qrImagePublicId);
            } catch (deleteError) {
                console.error('Error deleting QR image from Cloudinary:', deleteError);
                // Continue with address deletion even if QR image deletion fails
            }
        }

        // Delete the address
        await Address.findByIdAndDelete(addressId);

        // Log the action
        await logActivity({
            type: 'info',
            action: 'address_deleted',
            description: `Address deleted: ${address.currency} (${address.network}) - ${address.address}`,
            user: req.user,
            details: {
                addressId: addressId,
                currency: address.currency,
                network: address.network,
                type: address.type,
                address: address.address,
                qrImageDeleted: !!address.qrImagePublicId,
                qrImagePublicId: address.qrImagePublicId
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        return res.status(200).json({
            success: true,
            message: 'Address deleted successfully',
            data: {
                deletedAddress: {
                    id: addressId,
                    currency: address.currency,
                    network: address.network,
                    type: address.type
                }
            }
        });

    } catch (error) {
        console.error('Error deleting address:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Update Charges
const updateCharges = async (req, res) => {
    const { type, chargePercentage } = req.body;

    const validTypes = ['deposit', 'withdraw', 'convertion'];

    if (!type || !validTypes.includes(type)) {
        await logWarning(
            `Charge update failed: Invalid type - ${type}`,
            'charge_update',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({
            success: false,
            message: `Invalid type. Valid options: ${validTypes.join(', ')}`
        });
    }

    if (chargePercentage === undefined || chargePercentage < 0 || chargePercentage > 100) {
        await logWarning(
            `Charge update failed: Invalid percentage - ${chargePercentage}`,
            'charge_update',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({
            success: false,
            message: 'Charge percentage must be between 0 and 100'
        });
    }

    try {
        // Check if charge for this type already exists
        const existingCharge = await Charges.findOne({ type });

        if (existingCharge) {
            // Update existing charge
            const oldPercentage = existingCharge.chargePercentage;
            existingCharge.chargePercentage = chargePercentage;
            await existingCharge.save();

            // Log successful update
            await logSuccess(
                `Charge updated: ${type} - ${oldPercentage}% to ${chargePercentage}%`,
                'charge_update',
                { 
                    user: req.user, 
                    details: { 
                        chargeId: existingCharge._id,
                        type,
                        oldPercentage,
                        newPercentage: chargePercentage,
                        updatedAt: new Date()
                    },
                    ipAddress: req.ip, 
                    userAgent: req.get('User-Agent') 
                }
            );

            return res.status(200).json({
                success: true,
                message: 'Charge updated successfully',
                data: existingCharge
            });
        } else {
            // Create new charge
            const newCharge = await Charges.create({
                type,
                chargePercentage
            });

            // Log successful creation
            await logSuccess(
                `Charge created: ${type} - ${chargePercentage}%`,
                'charge_create',
                { 
                    user: req.user, 
                    details: { 
                        chargeId: newCharge._id,
                        type,
                        chargePercentage,
                        createdAt: new Date()
                    },
                    ipAddress: req.ip, 
                    userAgent: req.get('User-Agent') 
                }
            );

            return res.status(201).json({
                success: true,
                message: 'Charge created successfully',
                data: newCharge
            });
        }
    } catch (error) {
        console.error('Error updating/creating charge:', error);
        await logWarning(
            `Charge update/creation error: ${error.message}`,
            'charge_update',
            { 
                user: req.user, 
                details: { error: error.message, stack: error.stack },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Update user status
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['active', 'inactive'].includes(status)) {
        await logWarning(
            `User status update failed: Invalid status - ${status}`,
            'user_status_update',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({ success: false, message: 'Invalid or missing status' });
    }
    try {
        const user = await Users.findByIdAndUpdate(id, { status }, { new: true });
        if (!user) {
            await logDeclined(
                `User status update failed: User not found - ${id}`,
                'user_status_update',
                { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
            );
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Log successful status update
        await logSuccess(
            `User status updated: ${user.email || user._id} - Status: ${status}`,
            'user_status_update',
            { 
                user: req.user, 
                details: { 
                    targetUser: user._id, 
                    targetEmail: user.email,
                    oldStatus: user.status,
                    newStatus: status,
                    updatedAt: new Date()
                },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        
        return res.status(200).json({ success: true, message: 'User status updated', data: user });
    } catch (error) {
        console.error('Error updating user:', error);
        await logWarning(
            `User status update error: ${error.message}`,
            'user_status_update',
            { 
                user: req.user, 
                details: { error: error.message, stack: error.stack },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const suspendUser = async (req, res) => {
    const { id } = req.params;
    console.log("Body:", req.body);
    const { reason, action } = req.body;

    // Validate required fields
    console.log("ID:", id);
    console.log("Reason:", reason);
    console.log("Action:", action);

    if (!id || !reason || action === undefined) {
        console.log('Missing required fields:', { id, reason, action });
        await logWarning(
            `User suspension failed: Missing required fields - id: ${id}, reason: ${reason}, action: ${action}`,
            'user_suspension',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({ 
            success: false, 
            message: 'id, reason, and action are required' 
        });
    }

    // Validate action value
    if (typeof action !== 'boolean') {
        await logWarning(
            `User suspension failed: Invalid action type - ${typeof action}`,
            'user_suspension',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({ 
            success: false, 
            message: 'action must be a boolean value (true for suspend, false for unsuspend)' 
        });
    }

    try {
        const user = await Users.findByIdAndUpdate(
            id, 
            { 
                isSuspended: action, 
                suspendReason: reason,
                // Optional: Add timestamp for when action was taken
                suspendedAt: action ? new Date() : null
            }, 
            { new: true }
        );

        if (!user) {
            await logDeclined(
                `User suspension failed: User not found - ${id}`,
                'user_suspension',
                { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
            );
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Dynamic success message based on action
        const actionMessage = action ? 'suspended' : 'unsuspended';
        
        // Log successful action
        await logSuccess(
            `User ${actionMessage}: ${user.email || user._id} - Reason: ${reason}`,
            'user_suspension',
            { 
                user: req.user, 
                details: { 
                    targetUser: user._id, 
                    targetEmail: user.email,
                    action: action,
                    reason: reason,
                    suspendedAt: action ? new Date() : null
                },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        
        return res.status(200).json({ 
            success: true, 
            message: `User ${actionMessage} successfully`, 
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                isSuspended: user.isSuspended,
                suspendReason: user.suspendReason,
                suspendedAt: user.suspendedAt
            }
        });

    } catch (error) {
        console.error('Error updating user suspension status:', error);
        await logWarning(
            `User suspension error: ${error.message}`,
            'user_suspension',
            { 
                user: req.user, 
                details: { error: error.message, stack: error.stack },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        return res.status(500).json({ 
            success: false, 
            message: 'Server error occurred while updating user status' 
        });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await Users.findByIdAndDelete(id);
        if (!user) {
            await logDeclined(
                `User deletion failed: User not found - ${id}`,
                'user_deletion',
                { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
            );
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Log successful deletion
        await logSuccess(
            `User deleted: ${user.email || user._id}`,
            'user_deletion',
            { 
                user: req.user, 
                details: { 
                    targetUser: user._id, 
                    targetEmail: user.email,
                    targetUsername: user.username,
                    deletedAt: new Date()
                },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        
        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        await logWarning(
            `User deletion error: ${error.message}`,
            'user_deletion',
            { 
                user: req.user, 
                details: { error: error.message, stack: error.stack },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Admin deposit into user wallet
const adminDeposit = async (req, res) => {
    const emailOrId = req.params.id;
    const { amount, currency, operation="add", reason="" } = req.body;
    
    if (!emailOrId || !amount || !currency) {
        await logWarning(
            `Admin deposit failed: Missing required fields - emailOrId: ${emailOrId}, amount: ${amount}, currency: ${currency}`,
            'admin_deposit',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({ success: false, message: 'emailOrId, amount, currency, and network are required' });
    }
    
    if (!operation || !['add', 'subtract'].includes(operation)) {
        await logWarning(
            `Admin deposit failed: Invalid operation - ${operation}`,
            'admin_deposit',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({ success: false, message: 'Invalid operation. Valid options: add, subtract' });
    }

    try {
        // Find user by email or ID
        let user = null;
        if (emailOrId.match(/^[0-9a-fA-F]{24}$/)) {
            user = await Users.findById(emailOrId);
        }
        if (!user) {
            user = await Users.findOne({ email: emailOrId });
        }
        if (!user) {
            await logDeclined(
                `Admin deposit failed: User not found - ${emailOrId}`,
                'admin_deposit',
                { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
            );
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Update balance
        await updateUserBalance({
            userId: user._id,
            currency,
            reason,
            amount,
            operation,
            type: 'admin_deposit',
            status: 'completed'
        });

        // Log successful admin deposit
        await logSuccess(
            `Admin ${operation} ${amount} ${currency} to user ${user.email || user._id} - Reason: ${reason}`,
            'admin_deposit',
            { 
                user: req.user, 
                details: { 
                    targetUser: user._id, 
                    amount, 
                    currency, 
                    operation, 
                    reason 
                },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );

        return res.status(200).json({ success: true, message: 'Deposit successful', userId: user._id });
    } catch (error) {
        console.error('Admin deposit error:', error);
        await logWarning(
            `Admin deposit error: ${error.message}`,
            'admin_deposit',
            { 
                user: req.user, 
                details: { error: error.message, stack: error.stack },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get packages
const getPackages = async (req, res) => {
    try {
        const packages = await Packages.find();
        return res.status(200).json({ success: true, data: packages });
    } catch (error) {
        console.error('Error fetching packages:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Update Package
const updatePackage = async (req, res) => {
    const { id } = req.params;
    const { name, features, price, duration, status, percentage } = req.body;
    if (!id || !name || !features || !status || !percentage || !price || !duration) {
        await logWarning(
            'Package update failed: Missing required fields',
            'package_update',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({ success: false, message: 'id, name, features, status, percentage, price, and duration are required' });
    }
    try {
        const package = await Packages.findByIdAndUpdate(id, { name, features, price, duration, status, percentage }, { new: true });
        if (!package) {
            await logDeclined(
                `Package update failed: Package not found - ${id}`,
                'package_update',
                { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
            );
            return res.status(404).json({ success: false, message: 'Package not found' });
        }
        
        // Log successful update
        await logSuccess(
            `Package updated: ${name} - Price: ${price}, Duration: ${duration} days, Percentage: ${percentage}%`,
            'package_update',
            { 
                user: req.user, 
                details: { 
                    packageId: package._id, 
                    name, 
                    price, 
                    duration, 
                    percentage,
                    status,
                    updatedAt: new Date()
                },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        
        return res.status(200).json({ success: true, message: 'Package updated successfully', data: package });
    } catch (error) {
        console.error('Error updating package:', error);
        await logWarning(
            `Package update error: ${error.message}`,
            'package_update',
            { 
                user: req.user, 
                details: { error: error.message, stack: error.stack },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}


// Create Package
const createPackage = async (req, res) => {
    const { name, features, price, duration, status, percentage } = req.body;
    if (!name || !features || !status || !percentage || !price || !duration) {
        await logWarning(
            'Package creation failed: Missing required fields',
            'package_create',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({ success: false, message: 'name, features, status, percentage, price, and duration are required' });
    }
    try {
        const package = await Packages.create({ name, features, price, duration, status, percentage });
        
        await logSuccess(
            `Package created: ${name} - Price: ${price}, Duration: ${duration} days, Percentage: ${percentage}%`,
            'package_create',
            { 
                user: req.user, 
                details: { packageId: package._id, name, price, duration, percentage },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        
        return res.status(201).json({ success: true, message: 'Package created successfully', data: package });
    } catch (error) {
        console.error('Error creating package:', error);
        await logWarning(
            `Package creation error: ${error.message}`,
            'package_create',
            { 
                user: req.user, 
                details: { error: error.message },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Delete Package
const deletePackage = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        await logWarning(
            'Package deletion failed: Missing package ID',
            'package_delete',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({ success: false, message: 'Package ID is required' });
    }
    try {
        // Check if package exists first
        const package = await Packages.findById(id);
        if (!package) {
            await logDeclined(
                `Package deletion failed: Package not found - ${id}`,
                'package_delete',
                { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
            );
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        // Remove package from users
        const users = await Users.find({ package: id });
        if (users.length > 0) {
            users.forEach(async (user) => {
                user.package = null;
                await user.save();
            });
        }

        // Delete package
        await Packages.findByIdAndDelete(id);
        
        await logSuccess(
            `Package deleted: ${package.name} - Affected users: ${users.length}`,
            'package_delete',
            { 
                user: req.user, 
                details: { 
                    packageId: id, 
                    packageName: package.name, 
                    affectedUsers: users.length 
                },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        
        return res.status(200).json({ success: true, message: 'Package deleted successfully' });
    } catch (error) {
        console.error('Error deleting package:', error);
        await logWarning(
            `Package deletion error: ${error.message}`,
            'package_delete',
            { 
                user: req.user, 
                details: { error: error.message },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const assignPackageToUser = async (req, res) => {
    const { userId, packageId } = req.body;
    if (!userId || !packageId) {
        await logWarning(
            'Package assignment failed: Missing required fields',
            'package_assignment',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({ success: false, message: 'userId and packageId are required' });
    }
    try {
        const user = await Users.findById(userId);
        if (!user) {
            await logDeclined(
                `Package assignment failed: User not found - ${userId}`,
                'package_assignment',
                { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
            );
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const package = await Packages.findById(packageId);
        if (!package) {
            await logDeclined(
                `Package assignment failed: Package not found - ${packageId}`,
                'package_assignment',
                { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
            );
            return res.status(404).json({ success: false, message: 'Package not found' });
        }
        user.package = package._id;
        await user.save();
        
        // Log successful assignment
        await logSuccess(
            `Package assigned: ${package.name} to user ${user.email || user._id}`,
            'package_assignment',
            { 
                user: req.user, 
                details: { 
                    targetUser: user._id, 
                    targetEmail: user.email,
                    packageId: package._id,
                    packageName: package.name,
                    assignedAt: new Date()
                },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        
        return res.status(200).json({ success: true, message: 'Package assigned to user successfully' });
    } catch (error) {
        console.error('Error assigning package to user:', error);
        await logWarning(
            `Package assignment error: ${error.message}`,
            'package_assignment',
            { 
                user: req.user, 
                details: { error: error.message, stack: error.stack },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Get logs with pagination
const getLogs = async (req, res) => {
    const { 
        page = 1, 
        limit = 20, 
        type, 
        user, 
        action, 
        startDate, 
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    try {
        // Build filter object
        const filter = {};
        
        if (type) filter.type = type;
        if (user) filter.user = user;
        if (action) filter.action = { $regex: action, $options: 'i' };
        
        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Validate sort parameters
        const validSortFields = ['createdAt', 'type', 'action', 'message'];
        const validSortOrders = ['asc', 'desc'];
        
        if (!validSortFields.includes(sortBy)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid sort field. Valid options: ${validSortFields.join(', ')}` 
            });
        }
        
        if (!validSortOrders.includes(sortOrder)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid sort order. Valid options: asc, desc' 
            });
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get total count
        const totalLogs = await Logs.countDocuments(filter);
        
        // Get logs with pagination
        const logs = await Logs.find(filter)
            .populate('user', 'fullName email')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        // Calculate pagination info
        const totalPages = Math.ceil(totalLogs / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        return res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalLogs,
                hasNextPage,
                hasPrevPage,
                limit: limitNum
            },
            filters: {
                type,
                user,
                action,
                startDate,
                endDate,
                sortBy,
                sortOrder
            }
        });

    } catch (error) {
        console.error('Error fetching logs:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Get log statistics
const getLogStats = async (req, res) => {
    try {
        // Get counts by type
        const typeStats = await Logs.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Get total logs
        const totalLogs = await Logs.countDocuments();

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentLogs = await Logs.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        // Get logs by day for the last 7 days
        const dailyStats = await Logs.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalLogs,
                recentLogs,
                typeStats,
                dailyStats
            }
        });

    } catch (error) {
        console.error('Error fetching log statistics:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Get user statistics
const getUserStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Total Users
        const totalUsers = await Users.countDocuments();
        
        // Active Users
        const activeUsers = await Users.countDocuments({ status: 'active' });
        
        // Verified Users (users with advanceVerification = true)
        const verifiedUsers = await Users.countDocuments({ advanceVerification: true });
        
        // New Users Today
        const newUsersToday = await Users.countDocuments({ 
            createdAt: { $gte: today } 
        });

        return res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                verifiedUsers,
                newUsersToday
            }
        });

    } catch (error) {
        console.error('Error fetching user statistics:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        // Total Users
        const totalUsers = await Users.countDocuments();
        
        // Total Revenue (completed deposits + admin deposits - completed withdrawals)
        const totalDeposits = await DepositRequest.aggregate([
            {
                $match: { status: 'completed' }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalAdminDeposits = await Transaction.aggregate([
            {
                $match: {
                    type: 'admin_deposit',
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalWithdrawals = await WithdrawRequest.aggregate([
            {
                $match: { status: 'completed' }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalRevenue = (totalDeposits[0]?.totalAmount || 0) + 
                           (totalAdminDeposits[0]?.totalAmount || 0) - 
                           (totalWithdrawals[0]?.totalAmount || 0);
        
        // Active Trades (active orders)
        const activeTrades = await Order.countDocuments({ status: 'active' });
        
        // Total Deposits (completed deposits only)
        const totalDepositsAmount = totalDeposits[0]?.totalAmount || 0;

        // Format numbers with commas and currency
        const formatNumber = (num) => {
            return num.toLocaleString('en-US');
        };

        const formatCurrency = (num) => {
            return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        };

        // Generate User Growth Chart Data (last 7 days)
        const userGrowthData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            const userCount = await Users.countDocuments({
                createdAt: { $lt: nextDate }
            });
            
            userGrowthData.push({
                time: date.toISOString().split('T')[0],
                value: userCount
            });
        }

        // Generate Revenue Trends Chart Data (last 6 months)
        const revenueTrendsData = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            
            const nextMonth = new Date(date);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            
            const monthlyDeposits = await DepositRequest.aggregate([
                {
                    $match: {
                        status: 'completed',
                        createdAt: { $gte: date, $lt: nextMonth }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ]);

            const monthlyAdminDeposits = await Transaction.aggregate([
                {
                    $match: {
                        type: 'admin_deposit',
                        status: 'completed',
                        createdAt: { $gte: date, $lt: nextMonth }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ]);

            const monthlyWithdrawals = await WithdrawRequest.aggregate([
                {
                    $match: {
                        status: 'completed',
                        createdAt: { $gte: date, $lt: nextMonth }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ]);

            const monthlyRevenue = (monthlyDeposits[0]?.totalAmount || 0) + 
                                 (monthlyAdminDeposits[0]?.totalAmount || 0) - 
                                 (monthlyWithdrawals[0]?.totalAmount || 0);

            revenueTrendsData.push({
                month: months[date.getMonth()],
                revenue: Math.round(monthlyRevenue)
            });
        }

        // Generate Trading Volume Chart Data (last 7 days with mock data for demonstration)
        const tradingVolumeData = [];
        const basePrice = 50000;
        const volatility = 0.02; // 2% volatility
        
        for (let i = 6; i >= 0; i--) {
            const timestamp = Math.floor((Date.now() - (i * 24 * 60 * 60 * 1000)) / 1000);
            const open = basePrice + (Math.random() - 0.5) * basePrice * volatility;
            const high = open + Math.random() * basePrice * volatility;
            const low = open - Math.random() * basePrice * volatility;
            const close = open + (Math.random() - 0.5) * basePrice * volatility * 0.5;
            
            tradingVolumeData.push({
                time: timestamp,
                open: Math.round(open),
                high: Math.round(high),
                low: Math.round(low),
                close: Math.round(close)
            });
        }

        return res.status(200).json({
            success: true,
            stats: {
                "Total Users": formatNumber(totalUsers),
                "Total Revenue": formatCurrency(totalRevenue),
                "Active Trades": formatNumber(activeTrades),
                "Total Deposits": formatCurrency(totalDepositsAmount)
            }
            // charts: [
            //     {
            //         "title": "User Growth",
            //         "type": "line",
            //         "data": userGrowthData
            //     },
            //     {
            //         "title": "Revenue Trends",
            //         "type": "bar",
            //         "data": revenueTrendsData
            //     },
            //     {
            //         "title": "Trading Volume",
            //         "type": "candlestick",
            //         "data": tradingVolumeData
            //     }
            // ]
        });

    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Get dashboard data
const getDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        // Total Users
        const totalUsers = await Users.countDocuments();
        const activeUsers = await Users.countDocuments({ status: 'active' });
        const newUsersToday = await Users.countDocuments({ 
            createdAt: { $gte: today } 
        });
        const newUsersThisWeek = await Users.countDocuments({ 
            createdAt: { $gte: lastWeek } 
        });

        // Daily Transactions (deposits + withdrawals + admin deposits)
        const dailyDeposits = await DepositRequest.aggregate([
            {
                $match: {
                    createdAt: { $gte: today },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const dailyWithdrawals = await WithdrawRequest.aggregate([
            {
                $match: {
                    createdAt: { $gte: today },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const dailyAdminDeposits = await Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: today },
                    type: 'admin_deposit',
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const dailyTransactionsAmount = (dailyDeposits[0]?.totalAmount || 0) + 
                                      (dailyWithdrawals[0]?.totalAmount || 0) + 
                                      (dailyAdminDeposits[0]?.totalAmount || 0);
        const dailyTransactionsCount = (dailyDeposits[0]?.count || 0) + 
                                     (dailyWithdrawals[0]?.count || 0) + 
                                     (dailyAdminDeposits[0]?.count || 0);

        // Pending Withdrawals
        const pendingWithdrawals = await WithdrawRequest.aggregate([
            {
                $match: { status: 'pending' }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Revenue (completed deposits + admin deposits - completed withdrawals)
        const totalDeposits = await DepositRequest.aggregate([
            {
                $match: { status: 'completed' }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalAdminDeposits = await Transaction.aggregate([
            {
                $match: {
                    type: 'admin_deposit',
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalWithdrawals = await WithdrawRequest.aggregate([
            {
                $match: { status: 'completed' }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const revenue = (totalDeposits[0]?.totalAmount || 0) + 
                       (totalAdminDeposits[0]?.totalAmount || 0) - 
                       (totalWithdrawals[0]?.totalAmount || 0);

        // Active Orders
        const activeOrders = await Order.countDocuments({ status: 'active' });
        const totalOrders = await Order.countDocuments();
        const profitableOrders = await Order.countDocuments({ 
            status: 'active', 
            pnl: { $gt: 0 } 
        });

        // Pending Deposits
        const pendingDeposits = await DepositRequest.countDocuments({ status: 'pending' });

        // Recent Activity (last 24 hours)
        const recentLogs = await Logs.countDocuments({
            createdAt: { $gte: yesterday }
        });

        // Package Statistics
        const totalPackages = await Packages.countDocuments();
        const activePackages = await Packages.countDocuments({ status: 'active' });
        const usersWithPackages = await Users.countDocuments({ package: { $exists: true, $ne: null } });

        // Balance Statistics
        const totalBalance = await Balance.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // Weekly Growth
        const weeklyDeposits = await DepositRequest.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastWeek },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Currency Distribution
        const currencyDistribution = await Balance.aggregate([
            {
                $group: {
                    _id: '$currency',
                    totalAmount: { $sum: '$amount' },
                    userCount: { $sum: 1 }
                }
            },
            {
                $sort: { totalAmount: -1 }
            }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                // User Statistics
                totalUsers,
                activeUsers,
                newUsersToday,
                newUsersThisWeek,

                // Transaction Statistics
                dailyTransactions: {
                    amount: dailyTransactionsAmount,
                    count: dailyTransactionsCount,
                    deposits: dailyDeposits[0]?.totalAmount || 0,
                    withdrawals: dailyWithdrawals[0]?.totalAmount || 0,
                    adminDeposits: dailyAdminDeposits[0]?.totalAmount || 0
                },

                // Withdrawal Statistics
                pendingWithdrawals: {
                    amount: pendingWithdrawals[0]?.totalAmount || 0,
                    count: pendingWithdrawals[0]?.count || 0
                },

                // Revenue
                revenue,

                // Order Statistics
                activeOrders,
                totalOrders,
                profitableOrders,

                // Deposit Statistics
                pendingDeposits,

                // Activity
                recentLogs,

                // Package Statistics
                totalPackages,
                activePackages,
                usersWithPackages,

                // Balance Statistics
                totalBalance: totalBalance[0]?.totalAmount || 0,

                // Weekly Data
                weeklyDeposits,

                // Currency Distribution
                currencyDistribution,

                // Additional Metrics
                platformHealth: {
                    activeUsersPercentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0,
                    profitableOrdersPercentage: activeOrders > 0 ? ((profitableOrders / activeOrders) * 100).toFixed(2) : 0,
                    packageAdoptionRate: totalUsers > 0 ? ((usersWithPackages / totalUsers) * 100).toFixed(2) : 0
                }
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const { 
            status, 
            direction, 
            ticker, 
            action, 
            userId,
            startDate,
            endDate,
            minPnl,
            maxPnl,
            minPercentage,
            maxPercentage
        } = req.query;

        // Build filter object
        const filter = {};

        // Status filter
        if (status && ['active', 'closed', 'cancelled'].includes(status)) {
            filter.status = status;
        }

        // Direction filter
        if (direction && ['long', 'short'].includes(direction)) {
            filter.direction = direction;
        }

        // Ticker filter
        if (ticker) {
            filter.ticker = { $regex: ticker, $options: 'i' };
        }

        // Action filter
        if (action && ['profit', 'loss'].includes(action)) {
            filter.action = action;
        }

        // User filter
        if (userId) {
            filter.user = userId;
        }

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        // PnL range filter
        if (minPnl !== undefined || maxPnl !== undefined) {
            filter.pnl = {};
            if (minPnl !== undefined) {
                filter.pnl.$gte = parseFloat(minPnl);
            }
            if (maxPnl !== undefined) {
                filter.pnl.$lte = parseFloat(maxPnl);
            }
        }

        // Percentage range filter
        if (minPercentage !== undefined || maxPercentage !== undefined) {
            filter.percentage = {};
            if (minPercentage !== undefined) {
                filter.percentage.$gte = parseFloat(minPercentage);
            }
            if (maxPercentage !== undefined) {
                filter.percentage.$lte = parseFloat(maxPercentage);
            }
        }

        // Get orders with user information
        const orders = await Order.find(filter)
            .populate('user', 'username email firstName lastName')
            .sort({ createdAt: -1 });

        // Process orders with time remaining and handle expiration
        const ordersWithTimeRemaining = await Promise.all(orders.map(async (order) => {
            const value = parseInt(order.duration.slice(0, -1));
            const orderEndTime = new Date(order.createdAt.getTime() + (value * 1000)); // Convert seconds to milliseconds
            const currentTime = new Date();

            // Calculate time remaining in seconds
            let timeRemainingSeconds = Math.max(0, Math.floor((orderEndTime.getTime() - currentTime.getTime()) / 1000));

            // Check if order duration has expired
            if (orderEndTime <= currentTime && order.status === 'active') {
                console.log('Order expired, setting to closed with loss');
                const userBalance = await Balance.findOne({ user: order.user._id || order.user, currency: 'USDT' });

                if (userBalance) {
                    order.status = 'closed';
                    order.action = 'loss';
                    order.amount = order.quantity;
                    userBalance.amount -= order.amount;

                    await userBalance.save();
                    await order.save();
                }
                timeRemainingSeconds = 0;
            }

            // Convert order to plain object and add time remaining
            const orderObj = order.toObject();
            orderObj.timeRemainingSeconds = timeRemainingSeconds;

            return orderObj;
        }));

        // Calculate summary statistics using processed orders
        const totalOrders = ordersWithTimeRemaining.length;
        const activeOrders = ordersWithTimeRemaining.filter(order => order.status === 'active').length;
        const closedOrders = ordersWithTimeRemaining.filter(order => order.status === 'closed').length;
        const cancelledOrders = ordersWithTimeRemaining.filter(order => order.status === 'cancelled').length;
        
        const totalPnl = ordersWithTimeRemaining.reduce((sum, order) => sum + (order.pnl || 0), 0);
        const profitableOrders = ordersWithTimeRemaining.filter(order => order.pnl > 0).length;
        const lossOrders = ordersWithTimeRemaining.filter(order => order.pnl < 0).length;

        const summary = {
            totalOrders,
            activeOrders,
            closedOrders,
            cancelledOrders,
            totalPnl,
            profitableOrders,
            lossOrders,
            averagePnl: totalOrders > 0 ? totalPnl / totalOrders : 0
        };

        res.json({
            success: true,
            data: {
                orders: ordersWithTimeRemaining,
                summary,
                filters: {
                    status,
                    direction,
                    ticker,
                    action,
                    userId,
                    startDate,
                    endDate,
                    minPnl,
                    maxPnl,
                    minPercentage,
                    maxPercentage
                }
            }
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

const determineOrderProfitability = async (req, res) => {
    const { orderId } = req.params;
    const { action } = req.body;

    if (!orderId || !action) {
        await logWarning(
            'Order profitability determination failed: Missing required fields',
            'order_profitability',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({ success: false, message: 'Order ID and action are required' });
    }
    if (!['loss', 'profit'].includes(action)) {
        await logWarning(
            `Order profitability determination failed: Invalid action - ${action}`,
            'order_profitability',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(400).json({ success: false, message: 'Invalid action. Valid options: loss, profit' });
    }

    const order = await Order.findById(orderId);
    if (!order || (order.status !== 'active' && order.status !== 'pending_profit')) {
        await logDeclined(
            `Order profitability determination failed: Order not found or invalid status - ${orderId}`,
            'order_profitability',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const userBalance = await Balance.findOne({ user: order.user, currency: 'USDT' });
    if (!userBalance) {
        await logDeclined(
            `Order profitability determination failed: User balance not found - ${order.user}`,
            'order_profitability',
            { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        return res.status(404).json({ success: false, message: 'User balance not found' });
    }

    const percentage = order.percentage;
    const oldBalance = userBalance.amount;

    if (action === 'loss') {
        userBalance.amount -= order.quantity;
    } else if (action === 'profit') {
        userBalance.amount += order.quantity * (percentage / 100);
    }
    order.percentage = percentage;
    order.amount = order.quantity;
    order.action = action;
    order.status = 'closed';
    await order.save();
    await userBalance.save();

    // Log successful profitability determination
    await logSuccess(
        `Order profitability determined: ${action} - Order: ${orderId}, User: ${order.user}`,
        'order_profitability',
        { 
            user: req.user, 
            details: { 
                orderId: order._id,
                targetUser: order.user,
                action: action,
                percentage: percentage,
                oldBalance: oldBalance,
                newBalance: userBalance.amount,
                pnl: order.pnl,
                determinedAt: new Date()
            },
            ipAddress: req.ip, 
            userAgent: req.get('User-Agent') 
        }
    );

    return res.status(200).json({ success: true, message: 'Order profitability determined' });
}

const getVerificationRequests = async (req, res) => {
    try {
        const { status } = req.query;

        if (status) {
            if (!['pending', 'approved', 'rejected'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }

            const verificationRequests = await Verification.find({ status: status });
            return res.status(200).json({ success: true, data: verificationRequests });
        } else {
            const verificationRequests = await Verification.find();
            return res.status(200).json({ success: true, data: verificationRequests });
        }
    } catch (error) {
        console.error('Error fetching verification requests:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const updateVerificationRequestStatus = async (req, res) => {
    try {
        const { verificationId } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            await logWarning(
                `Verification status update failed: Invalid status - ${status}`,
                'verification_status_update',
                { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
            );
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const verificationRequest = await Verification.findByIdAndUpdate(verificationId, { status: status }, { new: true });
        if (!verificationRequest) {
            await logDeclined(
                `Verification status update failed: Request not found - ${verificationId}`,
                'verification_status_update',
                { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
            );
            return res.status(404).json({ success: false, message: 'Verification request not found' });
        }

        if (status === 'approved') {
            const user = await Users.findById(verificationRequest.userId);
            if (!user) {
                await logDeclined(
                    `Verification approval failed: User not found - ${verificationRequest.userId}`,
                    'verification_status_update',
                    { user: req.user, ipAddress: req.ip, userAgent: req.get('User-Agent') }
                );
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            user.advanceVerification = true;
            await user.save();
        }
        
        // Log successful status update
        await logSuccess(
            `Verification status updated: ${status} - User: ${verificationRequest.userId}`,
            'verification_status_update',
            { 
                user: req.user, 
                details: { 
                    verificationId: verificationRequest._id,
                    targetUser: verificationRequest.userId,
                    oldStatus: verificationRequest.status,
                    newStatus: status,
                    advanceVerification: status === 'approved',
                    updatedAt: new Date()
                },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        
        return res.status(200).json({ success: true, data: verificationRequest });
    } catch (error) {
        console.error('Error updating verification request status:', error);
        await logWarning(
            `Verification status update error: ${error.message}`,
            'verification_status_update',
            { 
                user: req.user, 
                details: { error: error.message, stack: error.stack },
                ipAddress: req.ip, 
                userAgent: req.get('User-Agent') 
            }
        );
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Get all admin users
const getAdminUsers = async (req, res) => {
    try {
        const adminUsers = await Users.find({ 
            $or: [{ isAdmin: true }, { isSuperAdmin: true }] 
        }).select('-password');

        return res.status(200).json({
            success: true,
            data: adminUsers
        });
    } catch (error) {
        console.error('Error fetching admin users:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Promote or demote user admin status
const toggleAdminStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isSuperAdmin = false, action = 'promote' } = req.body;

        // Validate action
        if (!['promote', 'demote'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Action must be either "promote" or "demote"'
            });
        }

        // Check if user exists
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent modifying own account
        if (userId === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot modify your own admin status'
            });
        }

        let updateData = {};
        let actionType = '';
        let description = '';

        if (action === 'promote') {
            // Check if user is already an admin
            if (user.isAdmin || user.isSuperAdmin) {
                return res.status(400).json({
                    success: false,
                    message: 'User is already an admin'
                });
            }

            updateData = {
                isAdmin: true,
                isSuperAdmin
            };
            actionType = 'user_promoted_to_admin';
            description = `User promoted to admin: ${user.fullName} (${user.email})`;
        } else {
            // Check if user is not an admin
            if (!user.isAdmin && !user.isSuperAdmin) {
                return res.status(400).json({
                    success: false,
                    message: 'User is not an admin'
                });
            }

            // Prevent demoting the last super admin
            if (user.isSuperAdmin) {
                const superAdminCount = await Users.countDocuments({ isSuperAdmin: true });
                if (superAdminCount <= 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot demote the last super admin'
                    });
                }
            }

            updateData = {
                isAdmin: false,
                isSuperAdmin: false
            };
            actionType = 'admin_demoted';
            description = `Admin demoted to regular user: ${user.fullName} (${user.email})`;
        }

        const updatedUser = await Users.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true }
        ).select('-password');

        // Log the action
        await logActivity({
            type: action === 'promote' ? 'info' : 'warning',
            message: description,
            action: actionType,
            user: req.user,
            details: {
                userId: userId,
                fullName: user.fullName,
                email: user.email,
                action: action,
                isSuperAdmin: action === 'promote' ? isSuperAdmin : user.isSuperAdmin
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        const message = action === 'promote' 
            ? 'User promoted to admin successfully' 
            : 'Admin demoted to regular user successfully';

        return res.status(200).json({
            success: true,
            message: message,
            data: updatedUser
        });

    } catch (error) {
        console.error('Error toggling admin status:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};






module.exports = {
    getDepositRequests,
    getWithdrawRequests,
    updateDepositRequestStatus,
    updateWithdrawRequestStatus,
    getTransactionHistory,
    getTotalBalance,
    getUsers,
    getDepositAddresses,
    getWithdrawalAddresses,
    getCharges,
    updateAddresses,
    deleteAddress,
    updateCharges,
    updateUser,
    updateUserBalance,
    deleteUser,
    adminDeposit,
    getPackages,
    updatePackage,
    createPackage,
    deletePackage,
    assignPackageToUser,
    getLogs,
    getLogStats,
    getUserStats,
    getDashboardStats,
    getDashboard,
    getAllOrders,
    determineOrderProfitability,
    getVerificationRequests,
    updateVerificationRequestStatus,
    getAdminUsers,
    toggleAdminStatus,
    suspendUser
};



