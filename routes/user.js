const express = require('express');
const { 
    createDepositRequest, 
    withdrawalRequest, 
    getDepositAddresses, 
    getWithdrawalAddresses, 
    getBalances, 
    getTransactionHistory, 
    getCharges,
    getProfile,
    submitOrder,
    getActiveOrders,
    getOrderHistory,
    closeOrder,
    swapCoins,
    getDepositRequests,
    getWithdrawalRequests,
    getPackages,
    getUserPackage,
    enrollPackage,
    advanceVerification,
    getVerificationStatus,
    getSwapHistory,
    updateFundPassword
} = require('../controllers/user');
const { tokenRequired } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(tokenRequired);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile with referrals
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: User ID
 *                       example: "507f1f77bcf86cd799439011"
 *                     fullName:
 *                       type: string
 *                       description: Full name of the user
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       description: Email address
 *                       example: "john@example.com"
 *                     referralCode:
 *                       type: string
 *                       description: User's referral code
 *                       example: "JOHN123"
 *                     referredBy:
 *                       type: string
 *                       description: Referral code of the user who referred this user
 *                       example: "JANE456"
 *                     firstDeposit:
 *                       type: boolean
 *                       description: Whether user has made their first deposit
 *                       example: false
 *                     status:
 *                       type: string
 *                       enum: [active, inactive, suspended]
 *                       description: User status
 *                       example: "active"
 *                     emailVerified:
 *                       type: boolean
 *                       description: Whether email is verified
 *                       example: true
 *                     advanceVerification:
 *                       type: boolean
 *                       description: Whether user has completed advanced verification
 *                       example: false
 *                     package:
 *                       type: string
 *                       description: Package ID if user is enrolled in a package
 *                       example: "507f1f77bcf86cd799439012"
 *                     isAdmin:
 *                       type: boolean
 *                       description: Whether user is an admin
 *                       example: false
 *                     isSuperAdmin:
 *                       type: boolean
 *                       description: Whether user is a super admin
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the user was created
 *                     lastLogin:
 *                       type: string
 *                       format: date-time
 *                       description: Last login time
 *                     referrals:
 *                       type: array
 *                       description: List of users referred by this user
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Referred user ID
 *                             example: "507f1f77bcf86cd799439013"
 *                           email:
 *                             type: string
 *                             description: Email of the referred user
 *                             example: "referred@example.com"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: When the referred user was created
 *                           firstDeposit:
 *                             type: boolean
 *                             description: Whether the referred user has made their first deposit
 *                             example: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/user/deposit:
 *   post:
 *     summary: Create a deposit request
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - currency
 *               - network
 *               - amount
 *               - screenshot
 *             properties:
 *               user:
 *                 type: string
 *                 description: User ID
 *                 example: "507f1f77bcf86cd799439011"
 *               currency:
 *                 type: string
 *                 description: Cryptocurrency code
 *                 example: "BTC"
 *               network:
 *                 type: string
 *                 description: Blockchain network
 *                 example: "Bitcoin"
 *               amount:
 *                 type: number
 *                 description: Deposit amount
 *                 example: 0.001
 *               screenshot:
 *                 type: string
 *                 format: binary
 *                 description: Screenshot of the transaction
 *     responses:
 *       201:
 *         description: Deposit request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Deposit request created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/DepositRequest'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User or address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/deposit', createDepositRequest);

/**
 * @swagger
 * /api/user/withdraw:
 *   post:
 *     summary: Create a withdrawal request
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - currency
 *               - network
 *               - withdrawalAddress
 *               - amount
 *             properties:
 *               user:
 *                 type: string
 *                 description: User ID
 *                 example: "507f1f77bcf86cd799439011"
 *               currency:
 *                 type: string
 *                 description: Cryptocurrency code
 *                 example: "BTC"
 *               network:
 *                 type: string
 *                 description: Blockchain network
 *                 example: "Bitcoin"
 *               withdrawalAddress:
 *                 type: string
 *                 description: Withdrawal address
 *                 example: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
 *               amount:
 *                 type: number
 *                 description: Withdrawal amount
 *                 example: 0.001
 *     responses:
 *       201:
 *         description: Withdrawal request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Withdraw request created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/WithdrawRequest'
 *       400:
 *         description: Bad request or insufficient balance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/withdraw', withdrawalRequest);

/**
 * @swagger
 * /api/user/deposit-addresses:
 *   get:
 *     summary: Get deposit addresses
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deposit addresses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/deposit-addresses', getDepositAddresses);

/**
 * @swagger
 * /api/user/withdrawal-addresses:
 *   get:
 *     summary: Get withdrawal addresses
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Withdrawal addresses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/withdrawal-addresses', getWithdrawalAddresses);

/**
 * @swagger
 * /api/user/balances:
 *   get:
 *     summary: Get user balances
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User balances retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Balance'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/balances', getBalances);

/**
 * @swagger
 * /api/user/transactions:
 *   get:
 *     summary: Get user transaction history
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       transactionType:
 *                         type: string
 *                         enum: [deposit, withdrawal]
 *                         example: "deposit"
 *                       currency:
 *                         type: string
 *                         example: "BTC"
 *                       network:
 *                         type: string
 *                         example: "Bitcoin"
 *                       amount:
 *                         type: number
 *                         example: 0.001
 *                       status:
 *                         type: string
 *                         enum: [pending, completed, failed, deleted]
 *                         example: "pending"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: number
 *                   example: 10
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/transactions', getTransactionHistory);

/**
 * @swagger
 * /api/user/charges:
 *   get:
 *     summary: Get platform charges
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Charges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Charges'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/charges', getCharges);

/**
 * @swagger
 * /api/user/submit-order:
 *   post:
 *     summary: Submit a futures trading order
 *     tags: [Trading]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - direction
 *               - ticker
 *               - duration
 *             properties:
 *               direction:
 *                 type: string
 *                 enum: [long, short]
 *                 description: Trading direction
 *                 example: "long"
 *               ticker:
 *                 type: string
 *                 description: Trading pair
 *                 example: "BTC/USDT"
 *               duration:
 *                 type: string
 *                 enum: ["30s", "60s", "120s", "300s"]
 *                 description: Order duration in seconds
 *                 example: "30s"
 *               displayDuration:
 *                 type: string
 *                 format: date-time
 *                 description: Display duration timestamp (optional)
 *                 example: "2025-07-10T09:07:29.913Z"
 *     responses:
 *       201:
 *         description: Order submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "LONG order submitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     direction:
 *                       type: string
 *                       example: "long"
 *                     ticker:
 *                       type: string
 *                       example: "BTC/USDT"
 *                     entryPrice:
 *                       type: number
 *                       example: 45000.50
 *                     currentPrice:
 *                       type: number
 *                       example: 45000.50
 *                     percentage:
 *                       type: number
 *                       example: 40
 *                     duration:
 *                       type: string
 *                       example: "30s"
 *                     displayDuration:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-10T09:07:29.913Z"
 *                     status:
 *                       type: string
 *                       example: "active"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request or insufficient balance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/submit-order', submitOrder);

/**
 * @swagger
 * /api/user/active-orders:
 *   get:
 *     summary: Get user's active orders
 *     tags: [Trading]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 count:
 *                   type: number
 *                   example: 2
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/active-orders', getActiveOrders);

/**
 * @swagger
 * /api/user/order-history:
 *   get:
 *     summary: Get user's order history
 *     tags: [Trading]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 count:
 *                   type: number
 *                   example: 10
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/order-history', getOrderHistory);

/**
 * @swagger
 * /api/user/close-order/{orderId}:
 *   put:
 *     summary: Close an active order
 *     tags: [Trading]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Order closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Order closed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     direction:
 *                       type: string
 *                       example: "long"
 *                     ticker:
 *                       type: string
 *                       example: "BTC/USDT"
 *                     entryPrice:
 *                       type: number
 *                       example: 45000.50
 *                     exitPrice:
 *                       type: number
 *                       example: 45500.75
 *                     pnl:
 *                       type: number
 *                       example: 1.11
 *                     status:
 *                       type: string
 *                       example: "closed"
 *       404:
 *         description: Order not found or already closed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/close-order/:orderId', closeOrder);

/**
 * @swagger
 * /api/user/swap:
 *   post:
 *     summary: Swap coins using Binance API price
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from
 *               - to
 *               - amount
 *             properties:
 *               from:
 *                 type: string
 *                 description: Currency to swap from
 *                 example: "BTC"
 *               to:
 *                 type: string
 *                 description: Currency to swap to
 *                 example: "ETH"
 *               amount:
 *                 type: number
 *                 description: Amount to swap
 *                 example: 0.1
 *     responses:
 *       200:
 *         description: Swap successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Swapped 0.1 BTC to 1.5 ETH"
 *                 data:
 *                   type: object
 *                   properties:
 *                     from:
 *                       type: string
 *                       example: "BTC"
 *                     to:
 *                       type: string
 *                       example: "ETH"
 *                     amountSwapped:
 *                       type: number
 *                       example: 0.1
 *                     amountReceived:
 *                       type: number
 *                       example: 1.5
 *                     price:
 *                       type: number
 *                       example: 15
 *       400:
 *         description: Bad request or insufficient balance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/swap', swapCoins);

/**
 * @swagger
 * /api/user/deposit-requests:
 *   get:
 *     summary: Get all deposit requests for the logged-in user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deposit requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DepositRequest'
 *                 count:
 *                   type: number
 *                   example: 2
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/deposit-requests', getDepositRequests);

/**
 * @swagger
 * /api/user/withdrawal-requests:
 *   get:
 *     summary: Get all withdrawal requests for the logged-in user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Withdrawal requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WithdrawRequest'
 *                 count:
 *                   type: number
 *                   example: 2
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/withdrawal-requests', getWithdrawalRequests);

/**
 * @swagger
 * /api/user/packages:
 *   get:
 *     summary: Get all available packages
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Packages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Package'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/packages', getPackages);

/**
 * @swagger
 * /api/user/package:
 *   get:
 *     summary: Get user's enrolled package
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User package retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Package'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User or package not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/package', getUserPackage);

/**
 * @swagger
 * /api/user/enroll-package:
 *   post:
 *     summary: Enroll in a package
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packageId
 *             properties:
 *               packageId:
 *                 type: string
 *                 description: Package ID to enroll in
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Package enrolled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Package enrolled successfully"
 *       400:
 *         description: Bad request or insufficient balance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Package not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/enroll-package', enrollPackage);

/**
 * @swagger
 * /api/user/advance-verification:
 *   post:
 *     summary: Submit verification documents for KYC
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               frontIdImage:
 *                 type: string
 *                 format: binary
 *                 description: Front side of ID document (JPEG, PNG, WebP)
 *               backIdImage:
 *                 type: string
 *                 format: binary
 *                 description: Back side of ID document (JPEG, PNG, WebP)
 *               selfieImage:
 *                 type: string
 *                 format: binary
 *                 description: Selfie with ID document (JPEG, PNG, WebP)
 *     responses:
 *       201:
 *         description: Verification documents submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Verification documents submitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     verificationId:
 *                       type: string
 *                       description: ID of the verification request
 *                       example: "507f1f77bcf86cd799439011"
 *                     status:
 *                       type: string
 *                       description: Status of the verification
 *                       example: "pending"
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the verification was submitted
 *       400:
 *         description: Bad request - validation error or already pending verification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error or file upload failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/advance-verification', advanceVerification);

/**
 * @swagger
 * /api/user/verification-status:
 *   get:
 *     summary: Get verification status for the logged-in user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Verification'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/verification-status', getVerificationStatus);

/**
 * @swagger
 * /api/user/swap-history:
 *   get:
 *     summary: Get swap transaction history for the logged-in user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Swap history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: List of swap transactions
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Transaction ID
 *                         example: "507f1f77bcf86cd799439011"
 *                       user:
 *                         type: string
 *                         description: User ID
 *                         example: "507f1f77bcf86cd799439012"
 *                       type:
 *                         type: string
 *                         description: Transaction type
 *                         example: "swap"
 *                       amount:
 *                         type: number
 *                         description: Amount swapped
 *                         example: 100.5
 *                       currency:
 *                         type: string
 *                         description: Currency that was swapped
 *                         example: "BTC"
 *                       status:
 *                         type: string
 *                         description: Transaction status
 *                         example: "completed"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: When the transaction was created
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: When the transaction was last updated
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/swap-history', getSwapHistory);

/**
 * @swagger
 * /api/user/update-fund-password:
 *   put:
 *     summary: Update user's fund password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fundPassword
 *             properties:
 *               fundPassword:
 *                 type: string
 *                 description: New fund password
 *                 example: "newFundPassword123"
 *     responses:
 *       200:
 *         description: Fund password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Fund password updated successfully"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/update-fund-password', updateFundPassword);

module.exports = router;

