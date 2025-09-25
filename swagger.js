const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pivora Trading API',
      version: '1.0.0',
      description: 'API documentation for Pivora Trading cryptocurrency trading platform',
      contact: {
        name: 'Pivora Trading Support',
        email: 'support@Pivora Trading.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: process.env.SERVER_URL || 'https://api.Pivora Trading.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            fullName: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            emailVerified: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        DepositRequest: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            user: { type: 'string', example: '507f1f77bcf86cd799439011' },
            currency: { type: 'string', example: 'BTC' },
            network: { type: 'string', example: 'Bitcoin' },
            address: { type: 'string', example: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
            amount: { type: 'number', example: 0.001 },
            screenshot: { type: 'string', format: 'uri', example: 'https://res.cloudinary.com/...' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed', 'deleted'], example: 'pending' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        WithdrawRequest: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            user: { type: 'string', example: '507f1f77bcf86cd799439011' },
            currency: { type: 'string', example: 'BTC' },
            network: { type: 'string', example: 'Bitcoin' },
            amount: { type: 'number', example: 0.001 },
            finalAmount: { type: 'number', example: 0.00095 },
            serviceCharge: { type: 'number', example: 0.05 },
            address: { type: 'string', example: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed', 'deleted'], example: 'pending' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Balance: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            user: { type: 'string', example: '507f1f77bcf86cd799439011' },
            currency: { type: 'string', example: 'BTC' },
            network: { type: 'string', example: 'Bitcoin' },
            amount: { type: 'number', example: 0.001 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Address: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            currency: { type: 'string', example: 'BTC' },
            network: { type: 'string', example: 'Bitcoin' },
            address: { type: 'string', example: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
            type: { type: 'string', enum: ['deposit', 'withdraw'], example: 'deposit' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Charges: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            type: { type: 'string', enum: ['deposit', 'withdraw'], example: 'withdraw' },
            chargePercentage: { type: 'number', example: 5 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            user: { type: 'string', example: '507f1f77bcf86cd799439011' },
            direction: { type: 'string', enum: ['long', 'short'], example: 'long' },
            ticker: { type: 'string', example: 'BTC/USDT' },
            entryPrice: { type: 'number', example: 45000.50 },
            currentPrice: { type: 'number', example: 45500.75 },
            percentage: { type: 'number', example: 40 },
            duration: { type: 'string', example: '30s' },
            displayDuration: { type: 'string', format: 'date-time', example: '2025-07-10T09:07:29.913Z' },
            status: { type: 'string', enum: ['active', 'closed', 'cancelled', 'pending_profit'], example: 'active' },
            pnl: { type: 'number', example: 1.11 },
            timeRemainingSeconds: { type: 'number', example: 15 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs; 