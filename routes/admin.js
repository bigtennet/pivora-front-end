const express = require('express');
const { 
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
} = require('../controllers/admin');
const { tokenRequired } = require('../middleware/auth');
const { adminRequired, superAdminRequired } = require('../middleware/admin');

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(tokenRequired);
router.use(adminRequired);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics and metrics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                     totalUsers:
 *                       type: integer
 *                       description: Total number of users
 *                       example: 1245
 *                     activeUsers:
 *                       type: integer
 *                       description: Number of active users
 *                       example: 1180
 *                     newUsersToday:
 *                       type: integer
 *                       description: New users registered today
 *                       example: 15
 *                     newUsersThisWeek:
 *                       type: integer
 *                       description: New users registered this week
 *                       example: 89
 *                     dailyTransactions:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           description: Total transaction amount today
 *                           example: 312000
 *                         count:
 *                           type: integer
 *                           description: Number of transactions today
 *                           example: 45
 *                         deposits:
 *                           type: number
 *                           description: Total deposits today
 *                           example: 250000
 *                         withdrawals:
 *                           type: number
 *                           description: Total withdrawals today
 *                           example: 45000
 *                         adminDeposits:
 *                           type: number
 *                           description: Total admin deposits today
 *                           example: 17000
 *                     pendingWithdrawals:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           description: Total pending withdrawal amount
 *                           example: 45500
 *                         count:
 *                           type: integer
 *                           description: Number of pending withdrawals
 *                           example: 23
 *                     revenue:
 *                       type: number
 *                       description: Total platform revenue
 *                       example: 1245000
 *                     activeOrders:
 *                       type: integer
 *                       description: Number of active trading orders
 *                       example: 156
 *                     totalOrders:
 *                       type: integer
 *                       description: Total number of orders
 *                       example: 892
 *                     profitableOrders:
 *                       type: integer
 *                       description: Number of profitable orders
 *                       example: 134
 *                     pendingDeposits:
 *                       type: integer
 *                       description: Number of pending deposits
 *                       example: 8
 *                     recentLogs:
 *                       type: integer
 *                       description: Number of logs in last 24 hours
 *                       example: 234
 *                     totalPackages:
 *                       type: integer
 *                       description: Total number of packages
 *                       example: 5
 *                     activePackages:
 *                       type: integer
 *                       description: Number of active packages
 *                       example: 4
 *                     usersWithPackages:
 *                       type: integer
 *                       description: Users enrolled in packages
 *                       example: 567
 *                     totalBalance:
 *                       type: number
 *                       description: Total platform balance
 *                       example: 890000
 *                     weeklyDeposits:
 *                       type: array
 *                       description: Daily deposit data for the last 7 days
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "2024-01-15"
 *                           totalAmount:
 *                             type: number
 *                             example: 45000
 *                           count:
 *                             type: integer
 *                             example: 12
 *                     currencyDistribution:
 *                       type: array
 *                       description: Balance distribution by currency
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "USDT"
 *                           totalAmount:
 *                             type: number
 *                             example: 500000
 *                           userCount:
 *                             type: integer
 *                             example: 800
 *                     platformHealth:
 *                       type: object
 *                       properties:
 *                         activeUsersPercentage:
 *                           type: string
 *                           description: Percentage of active users
 *                           example: "94.78"
 *                         profitableOrdersPercentage:
 *                           type: string
 *                           description: Percentage of profitable orders
 *                           example: "85.90"
 *                         packageAdoptionRate:
 *                           type: string
 *                           description: Percentage of users with packages
 *                           example: "45.54"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/dashboard', adminRequired, getDashboard);

/**
 * @swagger
 * /api/admin/user-stats:
 *   get:
 *     summary: Get user statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
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
 *                     totalUsers:
 *                       type: integer
 *                       description: Total number of users
 *                       example: 1234
 *                     activeUsers:
 *                       type: integer
 *                       description: Number of active users
 *                       example: 987
 *                     verifiedUsers:
 *                       type: integer
 *                       description: Number of verified users
 *                       example: 456
 *                     newUsersToday:
 *                       type: integer
 *                       description: Number of new users today
 *                       example: 23
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/user-stats', adminRequired, getUserStats);

/**
 * @swagger
 * /api/admin/dashboard-stats:
 *   get:
 *     summary: Get dashboard statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     "Total Users":
 *                       type: string
 *                       description: Total number of users formatted with commas
 *                       example: "1,234"
 *                     "Total Revenue":
 *                       type: string
 *                       description: Total revenue formatted as currency
 *                       example: "$45,678.00"
 *                     "Active Trades":
 *                       type: string
 *                       description: Number of active trades formatted with commas
 *                       example: "567"
 *                     "Total Deposits":
 *                       type: string
 *                       description: Total deposits formatted as currency
 *                       example: "$23,456.00"
 *                 charts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         description: Chart title
 *                         example: "User Growth"
 *                       type:
 *                         type: string
 *                         description: Chart type
 *                         enum: [line, bar, candlestick]
 *                         example: "line"
 *                       data:
 *                         type: array
 *                         description: Chart data points
 *                         items:
 *                           type: object
 *                           properties:
 *                             time:
 *                               type: string
 *                               description: Time value for line/candlestick charts
 *                               example: "2024-01-01"
 *                             value:
 *                               type: number
 *                               description: Value for line charts
 *                               example: 1000
 *                             month:
 *                               type: string
 *                               description: Month for bar charts
 *                               example: "Jan"
 *                             revenue:
 *                               type: number
 *                               description: Revenue value for bar charts
 *                               example: 15000
 *                             open:
 *                               type: number
 *                               description: Open price for candlestick charts
 *                               example: 50000
 *                             high:
 *                               type: number
 *                               description: High price for candlestick charts
 *                               example: 51000
 *                             low:
 *                               type: number
 *                               description: Low price for candlestick charts
 *                               example: 49000
 *                             close:
 *                               type: number
 *                               description: Close price for candlestick charts
 *                               example: 50500
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/dashboard-stats', adminRequired, getDashboardStats);

/**
 * @swagger
 * /api/admin/deposits:
 *   get:
 *     summary: Get all deposit requests (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by currency
 *         example: "BTC"
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *         description: Filter by network
 *         example: "Bitcoin"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed]
 *         description: Filter by status
 *         example: "pending"
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
 *                   example: 10
 *                 filters:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "all"
 *                     user:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     currency:
 *                       type: string
 *                       example: "BTC"
 *                     network:
 *                       type: string
 *                       example: "Bitcoin"
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/deposits', adminRequired, getDepositRequests);

/**
 * @swagger
 * /api/admin/deposits/{id}/status/:
 *   put:
 *     summary: Update deposit request status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Deposit request ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, failed, deleted]
 *                 description: New status for the deposit request
 *                 example: "completed"
 *     responses:
 *       200:
 *         description: Deposit request status updated successfully
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
 *                   example: "Deposit request status updated successfully"
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
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Deposit request not found
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
router.put('/deposits/:id/status/', adminRequired, updateDepositRequestStatus);

/**
 * @swagger
 * /api/admin/withdrawals:
 *   get:
 *     summary: Get all withdrawal requests (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by currency
 *         example: "BTC"
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *         description: Filter by network
 *         example: "Bitcoin"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed]
 *         description: Filter by status
 *         example: "pending"
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
 *                   example: 10
 *                 filters:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "all"
 *                     user:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     currency:
 *                       type: string
 *                       example: "BTC"
 *                     network:
 *                       type: string
 *                       example: "Bitcoin"
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/withdrawals', adminRequired, getWithdrawRequests);

/**
 * @swagger
 * /api/admin/withdrawals/{id}/status:
 *   put:
 *     summary: Update withdrawal request status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Withdrawal request ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, failed, deleted]
 *                 description: New status for the withdrawal request
 *                 example: "completed"
 *     responses:
 *       200:
 *         description: Withdrawal request status updated successfully
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
 *                   example: "Withdrawal request status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/WithdrawRequest'
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
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Withdrawal request not found
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
router.put('/withdrawals/:id/status', adminRequired, updateWithdrawRequestStatus);

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Get all transaction history (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, admin_deposit]
 *         description: Filter by transaction type
 *         example: "deposit"
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by currency
 *         example: "BTC"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, deleted]
 *         description: Filter by status
 *         example: "completed"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *         example: "2024-12-31"
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
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           fullName:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john@example.com"
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
 *                         example: "completed"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: number
 *                   example: 50
 *                 filters:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     type:
 *                       type: string
 *                       example: "all"
 *                     currency:
 *                       type: string
 *                       example: "all"
 *                     status:
 *                       type: string
 *                       example: "all"
 *                     startDate:
 *                       type: string
 *                       example: "2024-01-01"
 *                     endDate:
 *                       type: string
 *                       example: "2024-12-31"
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/transactions', adminRequired, getTransactionHistory);

/**
 * @swagger
 * /api/admin/balance:
 *   get:
 *     summary: Get total platform balance (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total balance retrieved successfully
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
 *                     totalBalance:
 *                       type: number
 *                       example: 15.5
 *                     currencyBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           currency:
 *                             type: string
 *                             example: "BTC"
 *                           network:
 *                             type: string
 *                             example: "Bitcoin"
 *                           totalAmount:
 *                             type: number
 *                             example: 10.5
 *                           userCount:
 *                             type: number
 *                             example: 25
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/balance', adminRequired, getTotalBalance);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter by email
 *         example: "john@example.com"
 *       - in: query
 *         name: emailVerified
 *         schema:
 *           type: boolean
 *         description: Filter by email verification status
 *         example: true
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 *                 count:
 *                   type: number
 *                   example: 100
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/users', adminRequired, getUsers);

/**
 * @swagger
 * /api/admin/deposit-addresses:
 *   get:
 *     summary: Get all deposit addresses (Admin only)
 *     tags: [Admin]
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/deposit-addresses', adminRequired, getDepositAddresses);

/**
 * @swagger
 * /api/admin/withdrawal-addresses:
 *   get:
 *     summary: Get all withdrawal addresses (Admin only)
 *     tags: [Admin]
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/withdrawal-addresses', adminRequired, getWithdrawalAddresses);

/**
 * @swagger
 * /api/admin/addresses:
 *   post:
 *     summary: Update platform addresses (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addresses
 *             properties:
 *               addresses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - currency
 *                     - network
 *                     - address
 *                     - type
 *                   properties:
 *                     currency:
 *                       type: string
 *                       description: Cryptocurrency code
 *                       example: "BTC"
 *                     network:
 *                       type: string
 *                       description: Blockchain network
 *                       example: "Bitcoin"
 *                     address:
 *                       type: string
 *                       description: Wallet address
 *                       example: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
 *                     type:
 *                       type: string
 *                       enum: [deposit, withdraw]
 *                       description: Address type
 *                       example: "deposit"
 *     responses:
 *       200:
 *         description: Addresses updated successfully
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
 *                   example: "Addresses updated successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.post('/addresses', adminRequired, updateAddresses);

/**
 * @swagger
 * /api/admin/addresses/{addressId}:
 *   delete:
 *     summary: Delete a platform address (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID to delete
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Address deleted successfully
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
 *                   example: "Address deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedAddress:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: ID of the deleted address
 *                           example: "507f1f77bcf86cd799439011"
 *                         currency:
 *                           type: string
 *                           description: Currency of the deleted address
 *                           example: "BTC"
 *                         network:
 *                           type: string
 *                           description: Network of the deleted address
 *                           example: "Bitcoin"
 *                         type:
 *                           type: string
 *                           enum: [deposit, withdraw]
 *                           description: Type of the deleted address
 *                           example: "deposit"
 *       400:
 *         description: Bad request - Address ID required or pending transactions exist
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
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Address not found
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
router.delete('/addresses/:addressId', adminRequired, deleteAddress);

/**
 * @swagger
 * /api/admin/charges:
 *   get:
 *     summary: Get all platform charges (Admin only)
 *     tags: [Admin]
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
 *       403:
 *         description: Forbidden - Admin access required
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
 *   post:
 *     summary: Update platform charges (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - charges
 *             properties:
 *               charges:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - chargePercentage
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [deposit, withdraw]
 *                       description: Transaction type
 *                       example: "withdraw"
 *                     chargePercentage:
 *                       type: number
 *                       description: Charge percentage
 *                       example: 5
 *     responses:
 *       200:
 *         description: Charges updated successfully
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
 *                   example: "Charges updated successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Charges'
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/charges', adminRequired, getCharges);
router.post('/charges', adminRequired, updateCharges);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: New user status
 *                 example: "inactive"
 *     responses:
 *       200:
 *         description: User status updated
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
 *                   example: "User status updated"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid or missing status
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
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: "User deleted successfully"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/users/:id/', adminRequired, updateUser);
router.delete('/users/:id/', adminRequired, deleteUser);

/**
 * @swagger
 * /api/admin/users/{id}/suspend:
 *   post:
 *     summary: Suspend a user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to suspend
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for suspending the user
 *                 example: "Violation of terms of service"
 *     responses:
 *       200:
 *         description: User suspended successfully
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
 *                   example: "User suspended successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - Missing required fields
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
 *       403:
 *         description: Forbidden - Admin access required
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
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/users/:id/suspend', adminRequired, suspendUser);

/**
 * @swagger
 * /api/admin/users/{id}/balance:
 *   post:
 *     summary: Admin deposit into a user wallet
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID or Email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *               - operation
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to deposit
 *                 example: 100
 *               currency:
 *                 type: string
 *                 description: Currency code
 *                 example: "USDT"
 *               operation:
 *                 type: string
 *                 description: Operation to perform
 *                 example: "add"
 *               reason:
 *                 type: string
 *                 description: Reason for the operation
 *     responses:
 *       200:
 *         description: Deposit successful
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
 *                   example: "Deposit successful"
 *                 userId:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *       400:
 *         description: Bad request
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
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/users/:id/balance', adminRequired, adminDeposit);

/**
 * @swagger
 * /api/admin/packages:
 *   get:
 *     summary: Get all packages (Admin only)
 *     tags: [Admin]
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
 *       403:
 *         description: Forbidden - Admin access required
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
 *   post:
 *     summary: Create a new package (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - features
 *               - price
 *               - duration
 *               - status
 *               - percentage
 *             properties:
 *               name:
 *                 type: string
 *                 description: Package name
 *                 example: "Premium Plan"
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of package features
 *                 example: ["Feature 1", "Feature 2", "Feature 3"]
 *               price:
 *                 type: number
 *                 description: Package price
 *                 example: 99.99
 *               duration:
 *                 type: number
 *                 description: Package duration in days
 *                 example: 30
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Package status
 *                 example: "active"
 *               percentage:
 *                 type: number
 *                 description: Package percentage/return rate
 *                 example: 15.5
 *     responses:
 *       201:
 *         description: Package created successfully
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
 *                   example: "Package created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Package'
 *       400:
 *         description: Bad request - Missing required fields
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/packages', adminRequired, getPackages);
router.post('/packages', adminRequired, createPackage);

/**
 * @swagger
 * /api/admin/packages/{id}:
 *   put:
 *     summary: Update a package (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - features
 *               - price
 *               - duration
 *               - status
 *               - percentage
 *             properties:
 *               name:
 *                 type: string
 *                 description: Package name
 *                 example: "Premium Plan"
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of package features
 *                 example: ["Feature 1", "Feature 2", "Feature 3"]
 *               price:
 *                 type: number
 *                 description: Package price
 *                 example: 99.99
 *               duration:
 *                 type: number
 *                 description: Package duration in days
 *                 example: 30
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Package status
 *                 example: "active"
 *               percentage:
 *                 type: number
 *                 description: Package percentage/return rate
 *                 example: 15.5
 *     responses:
 *       200:
 *         description: Package updated successfully
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
 *                   example: "Package updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Package'
 *       400:
 *         description: Bad request - Missing required fields
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.put('/packages/:id', adminRequired, updatePackage);

/**
 * @swagger
 * /api/admin/packages/{id}:
 *   delete:
 *     summary: Delete a package (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Package deleted successfully
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
 *                   example: "Package deleted successfully"
 *       400:
 *         description: Bad request - Package ID is required
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.delete('/packages/:id', adminRequired, deletePackage);

/**
 * @swagger
 * /api/admin/packages/assign-package:
 *   post:
 *     summary: Assign a package to a user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - packageId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to assign package to
 *                 example: "507f1f77bcf86cd799439011"
 *               packageId:
 *                 type: string
 *                 description: Package ID to assign
 *                 example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Package assigned to user successfully
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
 *                   example: "Package assigned to user successfully"
 *       400:
 *         description: Bad request - Missing required fields
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.post('/packages/assign-package', adminRequired, assignPackageToUser);

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Get system logs with pagination and filtering (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of logs per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [warning, info, declined, success]
 *         description: Filter by log type
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action (case insensitive)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs until this date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, type, action, message]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
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
 *                     $ref: '#/components/schemas/Log'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalLogs:
 *                       type: integer
 *                       example: 100
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                 filters:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "success"
 *                     user:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     action:
 *                       type: string
 *                       example: "user_login"
 *                     startDate:
 *                       type: string
 *                       example: "2024-01-01"
 *                     endDate:
 *                       type: string
 *                       example: "2024-01-31"
 *                     sortBy:
 *                       type: string
 *                       example: "createdAt"
 *                     sortOrder:
 *                       type: string
 *                       example: "desc"
 *       400:
 *         description: Bad request - Invalid parameters
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/logs', adminRequired, getLogs);

/**
 * @swagger
 * /api/admin/logs/stats:
 *   get:
 *     summary: Get log statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Log statistics retrieved successfully
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
 *                     totalLogs:
 *                       type: integer
 *                       example: 1500
 *                     recentLogs:
 *                       type: integer
 *                       example: 150
 *                     typeStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "success"
 *                           count:
 *                             type: integer
 *                             example: 800
 *                     dailyStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "2024-01-15"
 *                           count:
 *                             type: integer
 *                             example: 25
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/logs/stats', adminRequired, getLogStats);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders with filters (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, closed, cancelled]
 *         description: Filter by order status
 *         example: "active"
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [long, short]
 *         description: Filter by order direction
 *         example: "long"
 *       - in: query
 *         name: ticker
 *         schema:
 *           type: string
 *         description: Filter by trading pair (case-insensitive)
 *         example: "BTC/USDT"
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [profit, loss]
 *         description: Filter by profit/loss action
 *         example: "profit"
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by specific user ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders created from this date
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders created until this date
 *         example: "2024-12-31"
 *       - in: query
 *         name: minPnl
 *         schema:
 *           type: number
 *         description: Minimum PnL value
 *         example: 100
 *       - in: query
 *         name: maxPnl
 *         schema:
 *           type: number
 *         description: Maximum PnL value
 *         example: 1000
 *       - in: query
 *         name: minPercentage
 *         schema:
 *           type: number
 *         description: Minimum percentage value
 *         example: 5
 *       - in: query
 *         name: maxPercentage
 *         schema:
 *           type: number
 *         description: Maximum percentage value
 *         example: 50
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           user:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               username:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                           direction:
 *                             type: string
 *                             enum: [long, short]
 *                             example: "long"
 *                           ticker:
 *                             type: string
 *                             example: "BTC/USDT"
 *                           entryPrice:
 *                             type: number
 *                             example: 45000
 *                           currentPrice:
 *                             type: number
 *                             example: 46000
 *                           status:
 *                             type: string
 *                             enum: [active, closed, cancelled]
 *                             example: "active"
 *                           pnl:
 *                             type: number
 *                             example: 1000
 *                           percentage:
 *                             type: number
 *                             example: 15.5
 *                           action:
 *                             type: string
 *                             enum: [profit, loss]
 *                             example: "profit"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalOrders:
 *                           type: integer
 *                           example: 150
 *                         activeOrders:
 *                           type: integer
 *                           example: 45
 *                         closedOrders:
 *                           type: integer
 *                           example: 95
 *                         cancelledOrders:
 *                           type: integer
 *                           example: 10
 *                         totalPnl:
 *                           type: number
 *                           example: 25000
 *                         profitableOrders:
 *                           type: integer
 *                           example: 120
 *                         lossOrders:
 *                           type: integer
 *                           example: 30
 *                         averagePnl:
 *                           type: number
 *                           example: 166.67
 *                     filters:
 *                       type: object
 *                       description: Applied filters
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/orders', adminRequired, getAllOrders);

/**
 * @swagger
 * /api/admin/orders/{orderId}/profitability:
 *   put:
 *     summary: Determine order profitability and adjust user balance (Admin only)
 *     tags: [Admin]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - percentage
 *               - action
 *             properties:
 *               percentage:
 *                 type: number
 *                 description: Percentage of profit or loss to apply
 *                 example: 15.5
 *                 minimum: 0
 *                 maximum: 100
 *               action:
 *                 type: string
 *                 enum: [loss, profit]
 *                 description: Whether the order resulted in profit or loss
 *                 example: "profit"
 *     responses:
 *       200:
 *         description: Order profitability determined successfully
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
 *                   example: "Order profitability determined"
 *       400:
 *         description: Bad request - Missing required fields or invalid action
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
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found or user balance not found
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
router.put('/orders/:orderId/profitability', adminRequired, determineOrderProfitability);

/**
 * @swagger
 * /api/admin/verification-requests:
 *   get:
 *     summary: Get verification requests with optional status filter (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter verification requests by status
 *         example: "pending"
 *     responses:
 *       200:
 *         description: Verification requests retrieved successfully
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
 *                         description: Verification request ID
 *                         example: "507f1f77bcf86cd799439011"
 *                       userId:
 *                         type: string
 *                         description: User ID who submitted the verification
 *                         example: "507f1f77bcf86cd799439012"
 *                       frontIdImage:
 *                         type: string
 *                         description: URL to front ID image
 *                         example: "https://res.cloudinary.com/example/image/upload/v123/front_id.jpg"
 *                       backIdImage:
 *                         type: string
 *                         description: URL to back ID image
 *                         example: "https://res.cloudinary.com/example/image/upload/v123/back_id.jpg"
 *                       selfieImage:
 *                         type: string
 *                         description: URL to selfie image
 *                         example: "https://res.cloudinary.com/example/image/upload/v123/selfie.jpg"
 *                       frontIdPublicId:
 *                         type: string
 *                         description: Cloudinary public ID for front ID image
 *                         example: "verification-documents/front_id_123"
 *                       backIdPublicId:
 *                         type: string
 *                         description: Cloudinary public ID for back ID image
 *                         example: "verification-documents/back_id_123"
 *                       selfiePublicId:
 *                         type: string
 *                         description: Cloudinary public ID for selfie image
 *                         example: "verification-documents/selfie_123"
 *                       status:
 *                         type: string
 *                         enum: [pending, approved, rejected]
 *                         description: Current status of the verification
 *                         example: "pending"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: When the verification was submitted
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: When the verification was last updated
 *       400:
 *         description: Bad request - Invalid status parameter
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/verification-requests', adminRequired, getVerificationRequests);

/**
 * @swagger
 * /api/admin/verification-requests/{verificationId}/status:
 *   put:
 *     summary: Update verification request status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: verificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification request ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *                 description: New status for the verification request
 *                 example: "approved"
 *     responses:
 *       200:
 *         description: Verification request status updated successfully
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
 *                       description: Verification request ID
 *                       example: "507f1f77bcf86cd799439011"
 *                     userId:
 *                       type: string
 *                       description: User ID who submitted the verification
 *                       example: "507f1f77bcf86cd799439012"
 *                     frontIdImage:
 *                       type: string
 *                       description: URL to front ID image
 *                       example: "https://res.cloudinary.com/example/image/upload/v123/front_id.jpg"
 *                     backIdImage:
 *                       type: string
 *                       description: URL to back ID image
 *                       example: "https://res.cloudinary.com/example/image/upload/v123/back_id.jpg"
 *                     selfieImage:
 *                       type: string
 *                       description: URL to selfie image
 *                       example: "https://res.cloudinary.com/example/image/upload/v123/selfie.jpg"
 *                     frontIdPublicId:
 *                       type: string
 *                       description: Cloudinary public ID for front ID image
 *                       example: "verification-documents/front_id_123"
 *                     backIdPublicId:
 *                       type: string
 *                       description: Cloudinary public ID for back ID image
 *                       example: "verification-documents/back_id_123"
 *                     selfiePublicId:
 *                       type: string
 *                       description: Cloudinary public ID for selfie image
 *                       example: "verification-documents/selfie_123"
 *                     status:
 *                       type: string
 *                       enum: [pending, approved, rejected]
 *                       description: Updated status of the verification
 *                       example: "approved"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the verification was submitted
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the verification was last updated
 *       400:
 *         description: Bad request - Invalid status or missing required fields
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
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Verification request not found
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
router.put('/verification-requests/:verificationId/status', adminRequired, updateVerificationRequestStatus);

/**
 * @swagger
 * /api/admin/admin-users:
 *   get:
 *     summary: Get all admin users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin users retrieved successfully
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
 *                         description: User ID
 *                         example: "507f1f77bcf86cd799439011"
 *                       fullName:
 *                         type: string
 *                         description: Full name of the admin
 *                         example: "John Doe"
 *                       email:
 *                         type: string
 *                         description: Email address
 *                         example: "john@example.com"
 *                       isAdmin:
 *                         type: boolean
 *                         description: Whether user is an admin
 *                         example: true
 *                       isSuperAdmin:
 *                         type: boolean
 *                         description: Whether user is a super admin
 *                         example: false
 *                       status:
 *                         type: string
 *                         enum: [active, inactive, suspended]
 *                         description: User status
 *                         example: "active"
 *                       emailVerified:
 *                         type: boolean
 *                         description: Whether email is verified
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: When the user was created
 *                       lastLogin:
 *                         type: string
 *                         format: date-time
 *                         description: Last login time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/admin-users', adminRequired, getAdminUsers);

/**
 * @swagger
 * /api/admin/users/{userId}/admin-status:
 *   post:
 *     summary: Promote or demote user admin status (Super Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to promote or demote
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [promote, demote]
 *                 description: Action to perform
 *                 example: "promote"
 *               isSuperAdmin:
 *                 type: boolean
 *                 description: Whether to promote as super admin (only for promote action)
 *                 example: false
 *     responses:
 *       200:
 *         description: User admin status updated successfully
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
 *                   example: "User promoted to admin successfully"
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
 *                       example: "Jane Smith"
 *                     email:
 *                       type: string
 *                       description: Email address
 *                       example: "jane@example.com"
 *                     isAdmin:
 *                       type: boolean
 *                       description: Whether user is an admin
 *                       example: true
 *                     isSuperAdmin:
 *                       type: boolean
 *                       description: Whether user is a super admin
 *                       example: false
 *                     status:
 *                       type: string
 *                       description: User status
 *                       example: "active"
 *                     emailVerified:
 *                       type: boolean
 *                       description: Whether email is verified
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the user was created
 *                     lastLogin:
 *                       type: string
 *                       format: date-time
 *                       description: Last login time
 *       400:
 *         description: Bad request - Invalid action, user already admin/not admin, or cannot modify own status
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
 *       403:
 *         description: Forbidden - Super admin access required
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
router.post('/users/:userId/admin-status', superAdminRequired, toggleAdminStatus);

module.exports = router; 