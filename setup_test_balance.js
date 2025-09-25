require('dotenv').config();
const mongoose = require('mongoose');
const { Users } = require('./models/users');
const { Balance } = require('./models/balance');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

async function setupTestBalance() {
    try {
        console.log('🔧 Setting up test USDT balance...');
        
        // Find a test user (you can modify this to target specific users)
        const user = await Users.findOne({ email: 'john@example.com' });
        
        if (!user) {
            console.log('❌ User not found. Please create a user first or modify the email.');
            return;
        }
        
        console.log(`✅ Found user: ${user.fullName} (${user.email})`);
        
        // Check if user already has USDT balance
        const existingBalance = await Balance.findOne({
            user: user._id,
            currency: 'USDT'
        });
        
        if (existingBalance) {
            console.log(`💰 User already has USDT balance: ${existingBalance.amount} USDT`);
            console.log('📝 Updating balance to 1000 USDT for testing...');
            
            existingBalance.amount = 1000;
            await existingBalance.save();
            
            console.log('✅ Balance updated successfully!');
        } else {
            console.log('📝 Creating new USDT balance...');
            
            // Create USDT balance
            const newBalance = await Balance.create({
                user: user._id,
                currency: 'USDT',
                network: 'Tron', // Using Tron network for USDT
                amount: 1000 // Starting with 1000 USDT for testing
            });
            
            console.log('✅ USDT balance created successfully!');
            console.log(`💰 Balance: ${newBalance.amount} USDT`);
        }
        
        console.log('');
        console.log('🎉 Setup complete! User can now test trading functionality.');
        console.log('');
        console.log('📝 Next steps:');
        console.log('1. Start the server: npm start');
        console.log('2. Run trading tests: node test_trading.js');
        console.log('3. Monitor cronjob activity in server logs');
        
    } catch (error) {
        console.error('❌ Error setting up test balance:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the setup
setupTestBalance(); 