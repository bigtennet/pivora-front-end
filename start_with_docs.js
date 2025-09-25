const { spawn } = require('child_process');
const { testSwaggerConfig } = require('./test_swagger');

console.log('🚀 Starting Pivora Trading API Server with Documentation...\n');

// Test Swagger configuration first
console.log('Testing Swagger configuration...');
testSwaggerConfig();

console.log('\n' + '='.repeat(60));
console.log('📚 API DOCUMENTATION');
console.log('='.repeat(60));
console.log('Once the server starts, you can access:');
console.log('• API Documentation: http://localhost:5000/api-docs');
console.log('• API Base URL: http://localhost:5000/api');
console.log('• Health Check: http://localhost:5000/');
console.log('\n📋 Quick Start:');
console.log('1. Open http://localhost:5000/api-docs in your browser');
console.log('2. Use the "Try it out" feature to test endpoints');
console.log('3. For authenticated endpoints, use the "Authorize" button');
console.log('4. Get a JWT token from /api/auth/login first');
console.log('='.repeat(60) + '\n');

// Start the server
const server = spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true
});

server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
});

server.on('close', (code) => {
    console.log(`\n🛑 Server stopped with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGTERM');
    process.exit(0);
}); 