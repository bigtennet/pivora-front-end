const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let USER_TOKEN = '';
let ORDER_ID = '';

// Test data
const testUser = {
    email: 'john@example.com',
    password: 'password123'
};

const testOrder = {
    direction: 'long',
    ticker: 'BTC/USDT'
};

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, endpoint, data = null, token = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message 
        };
    }
}

async function runTests() {
    log('🚀 Starting Trading API Tests', 'blue');
    log('================================', 'blue');
    console.log('');

    // 1. Login to get token
    log('1. Testing User Login...', 'yellow');
    const loginResult = await testEndpoint('POST', '/api/auth/login', testUser);
    
    if (loginResult.success) {
        USER_TOKEN = loginResult.data.token;
        log('✅ Login successful', 'green');
        log(`Token: ${USER_TOKEN.substring(0, 20)}...`, 'blue');
    } else {
        log('❌ Login failed', 'red');
        log(`Error: ${JSON.stringify(loginResult.error)}`, 'red');
        return;
    }
    console.log('');

    // 2. Submit a trading order
    log('2. Testing Submit Order...', 'yellow');
    const submitResult = await testEndpoint('POST', '/api/user/submit-order', testOrder, USER_TOKEN);
    
    if (submitResult.success) {
        ORDER_ID = submitResult.data.data.orderId;
        log('✅ Order submitted successfully', 'green');
        log(`Order ID: ${ORDER_ID}`, 'blue');
        log(`Direction: ${submitResult.data.data.direction}`, 'blue');
        log(`Ticker: ${submitResult.data.data.ticker}`, 'blue');
        log(`Entry Price: $${submitResult.data.data.entryPrice}`, 'blue');
    } else {
        log('❌ Order submission failed', 'red');
        log(`Error: ${JSON.stringify(submitResult.error)}`, 'red');
        return;
    }
    console.log('');

    // 3. Get active orders
    log('3. Testing Get Active Orders...', 'yellow');
    const activeOrdersResult = await testEndpoint('GET', '/api/user/active-orders', null, USER_TOKEN);
    
    if (activeOrdersResult.success) {
        log('✅ Active orders retrieved successfully', 'green');
        log(`Count: ${activeOrdersResult.data.count}`, 'blue');
        if (activeOrdersResult.data.data.length > 0) {
            const order = activeOrdersResult.data.data[0];
            log(`Latest Order: ${order.direction} ${order.ticker} at $${order.entryPrice}`, 'blue');
        }
    } else {
        log('❌ Failed to get active orders', 'red');
        log(`Error: ${JSON.stringify(activeOrdersResult.error)}`, 'red');
    }
    console.log('');

    // 4. Get order history
    log('4. Testing Get Order History...', 'yellow');
    const historyResult = await testEndpoint('GET', '/api/user/order-history', null, USER_TOKEN);
    
    if (historyResult.success) {
        log('✅ Order history retrieved successfully', 'green');
        log(`Total Orders: ${historyResult.data.count}`, 'blue');
    } else {
        log('❌ Failed to get order history', 'red');
        log(`Error: ${JSON.stringify(historyResult.error)}`, 'red');
    }
    console.log('');

    // 5. Test Binance API integration
    log('5. Testing Binance API Integration...', 'yellow');
    try {
        const binanceResponse = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const currentPrice = parseFloat(binanceResponse.data.price);
        log('✅ Binance API working', 'green');
        log(`Current BTC/USDT Price: $${currentPrice}`, 'blue');
    } catch (error) {
        log('❌ Binance API failed', 'red');
        log(`Error: ${error.message}`, 'red');
    }
    console.log('');

    // 6. Close the order (optional - uncomment to test)
    /*
    log('6. Testing Close Order...', 'yellow');
    const closeResult = await testEndpoint('PUT', `/api/user/close-order/${ORDER_ID}`, null, USER_TOKEN);
    
    if (closeResult.success) {
        log('✅ Order closed successfully', 'green');
        log(`Final PnL: ${closeResult.data.data.pnl}%`, 'blue');
    } else {
        log('❌ Failed to close order', 'red');
        log(`Error: ${JSON.stringify(closeResult.error)}`, 'red');
    }
    console.log('');
    */

    log('🎉 Trading API Tests Completed!', 'green');
    log('================================', 'green');
    console.log('');
    log('📝 Next Steps:', 'blue');
    log('1. Check the server logs for cronjob activity', 'blue');
    log('2. Wait 5 minutes for the first price tracking cycle', 'blue');
    log('3. Check user balance changes in the database', 'blue');
    log('4. Monitor order PnL updates', 'blue');
}

// Run the tests
runTests().catch(error => {
    log('❌ Test execution failed', 'red');
    log(`Error: ${error.message}`, 'red');
}); 