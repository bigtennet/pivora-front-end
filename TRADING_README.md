# Futures Trading System

This document describes the futures trading functionality added to the Pivora Trading API.

## Overview

The futures trading system allows users to:
- Submit long/short orders for cryptocurrency pairs
- Track real-time price movements via Binance API
- Automatically calculate PnL based on price changes
- Adjust user balances based on trading performance

## Features

### 1. Order Management
- **Submit Orders**: Create long or short positions
- **Active Orders**: View currently open positions
- **Order History**: Track all past trades
- **Close Orders**: Manually close positions

### 2. Automated Price Tracking
- **Real-time Data**: Fetches current prices from Binance API
- **5-minute Intervals**: Cronjob runs every 5 minutes
- **PnL Calculation**: Automatic profit/loss calculation
- **Balance Updates**: User balances adjusted based on performance

### 3. Risk Management
- **0.1% Balance Adjustment**: Small percentage changes to prevent large losses
- **Direction-based Logic**: Different logic for long vs short positions
- **Price Validation**: Ensures valid trading pairs

## API Endpoints

### Submit Order
```http
POST /api/user/submit-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "direction": "long|short",
  "ticker": "BTC/USDT"
}
```

**Response:**
```json
{
  "success": true,
  "message": "LONG order submitted successfully",
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "direction": "long",
    "ticker": "BTC/USDT",
    "entryPrice": 45000.50,
    "currentPrice": 45000.50,
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Active Orders
```http
GET /api/user/active-orders
Authorization: Bearer <token>
```

### Get Order History
```http
GET /api/user/order-history
Authorization: Bearer <token>
```

### Close Order
```http
PUT /api/user/close-order/{orderId}
Authorization: Bearer <token>
```

## Database Models

### Order Model
```javascript
{
  user: ObjectId,           // Reference to user
  direction: String,        // 'long' or 'short'
  ticker: String,          // Trading pair (e.g., 'BTC/USDT')
  entryPrice: Number,      // Price when order was placed
  currentPrice: Number,    // Latest price
  status: String,          // 'active', 'closed', 'cancelled'
  pnl: Number,             // Profit/Loss percentage
  createdAt: Date,
  updatedAt: Date
}
```

### Price Tracker Model
```javascript
{
  ticker: String,          // Trading pair
  currentPrice: Number,    // Latest price
  lastUpdated: Date,       // Last update timestamp
  priceHistory: [          // Array of price snapshots
    {
      price: Number,
      timestamp: Date
    }
  ]
}
```

## Cronjob Logic

The system runs a cronjob every 5 minutes that:

1. **Fetches Active Orders**: Gets all orders with status 'active'
2. **Updates Prices**: Fetches current prices from Binance API
3. **Calculates PnL**: Determines if each order is profitable
4. **Updates Balances**: Adjusts user balances by 0.1%

### PnL Calculation Logic

#### For Long Positions:
- **Profitable**: Current price > Entry price
- **Action**: Add 0.1% to user balance
- **Unprofitable**: Current price < Entry price  
- **Action**: Subtract 0.1% from user balance

#### For Short Positions:
- **Profitable**: Current price < Entry price
- **Action**: Add 0.1% to user balance
- **Unprofitable**: Current price > Entry price
- **Action**: Subtract 0.1% from user balance

## Setup Instructions

### 1. Environment Variables
Ensure your `.env` file includes:
```env
MONGO_URI=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret
```

### 2. Dependencies
The system requires these packages (already in package.json):
```json
{
  "axios": "^1.9.0",
  "node-cron": "^4.1.0",
  "mongoose": "^8.15.2"
}
```

### 3. Database Setup
The system automatically creates the necessary collections:
- `orders` - Trading orders
- `pricetrackers` - Price tracking data
- `balances` - User balances (existing)

### 4. User Balance Setup
Before trading, ensure users have a USDT balance:
```javascript
// Example: Add USDT balance for user
await Balance.create({
  user: userId,
  currency: 'USDT',
  network: 'Tron', // or appropriate network
  amount: 1000 // Starting balance
});
```

## Testing

### 1. Run the Test Script
```bash
node test_trading.js
```

### 2. Manual Testing with curl
```bash
# Submit an order
curl -X POST http://localhost:5000/api/user/submit-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"direction": "long", "ticker": "BTC/USDT"}'

# Get active orders
curl -X GET http://localhost:5000/api/user/active-orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Monitor Cronjob Activity
Check server logs for cronjob messages:
```
🚀 Initializing Price Tracking Cron Job...
✅ Price tracking cron job scheduled (every 5 minutes)
📊 Starting price tracking cron job...
💰 BTC/USDT: $45000.50
✅ User john@example.com gained 1.0 USDT (Long: true, Price: 45500 > 45000)
```

## Supported Trading Pairs

The system supports any trading pair available on Binance. Common examples:
- BTC/USDT
- ETH/USDT
- BNB/USDT
- ADA/USDT
- DOT/USDT

## Error Handling

### Common Errors:
1. **Invalid Direction**: Must be 'long' or 'short'
2. **Invalid Ticker**: Must be in format 'XXX/YYY'
3. **Insufficient Balance**: User needs USDT balance
4. **Binance API Error**: Network issues or invalid symbol
5. **Order Not Found**: When trying to close non-existent order

### Error Response Format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Input Validation**: All inputs are validated and sanitized
3. **Rate Limiting**: Consider implementing rate limits for order submission
4. **Balance Protection**: System prevents negative balances
5. **API Key Security**: Binance API calls use public endpoints only

## Monitoring and Maintenance

### Logs to Monitor:
- Order creation/deletion
- Price tracking activity
- Balance adjustments
- API errors

### Database Maintenance:
- Monitor order collection size
- Clean up old price history (automated)
- Backup trading data regularly

### Performance Considerations:
- Cronjob runs every 5 minutes
- Price history limited to 100 entries per ticker
- Efficient database queries with proper indexing

## Future Enhancements

Potential improvements:
1. **Leverage Trading**: Add leverage options
2. **Stop Loss/Take Profit**: Automatic order closure
3. **Multiple Timeframes**: Different cronjob intervals
4. **Advanced Analytics**: Trading performance metrics
5. **Risk Management**: Maximum loss limits
6. **Real-time WebSocket**: Live price updates

## Support

For issues or questions:
1. Check server logs for error messages
2. Verify database connectivity
3. Test Binance API connectivity
4. Review user balance and permissions 