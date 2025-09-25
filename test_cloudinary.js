require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('🔍 Testing Cloudinary Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing'}`);
console.log(`CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'}`);

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log('\n❌ Missing Cloudinary environment variables!');
    console.log('\n📝 Please create a .env file with:');
    console.log('CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('CLOUDINARY_API_KEY=your_api_key');
    console.log('CLOUDINARY_API_SECRET=your_api_secret');
    process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('\n🔧 Cloudinary Configuration:');
console.log(`Cloud Name: ${cloudinary.config().cloud_name}`);
console.log(`API Key: ${cloudinary.config().api_key ? '✅ Set' : '❌ Missing'}`);
console.log(`API Secret: ${cloudinary.config().api_secret ? '✅ Set' : '❌ Missing'}`);

// Test Cloudinary connection
console.log('\n🧪 Testing Cloudinary Connection...');

cloudinary.api.ping()
    .then(result => {
        console.log('✅ Cloudinary connection successful!');
        console.log('Response:', result);
        
        // Test upload with a simple text file
        console.log('\n📤 Testing file upload...');
        const testData = 'This is a test file for Cloudinary';
        const testBuffer = Buffer.from(testData);
        
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'test',
                    resource_type: 'raw'
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            ).end(testBuffer);
        });
    })
    .then(result => {
        console.log('✅ File upload test successful!');
        console.log('Upload Result:', {
            public_id: result.public_id,
            secure_url: result.secure_url,
            format: result.format
        });
        
        // Clean up - delete the test file
        console.log('\n🧹 Cleaning up test file...');
        return cloudinary.uploader.destroy(result.public_id);
    })
    .then(result => {
        console.log('✅ Test file deleted successfully!');
        console.log('\n🎉 All Cloudinary tests passed!');
        console.log('\n💡 Your Cloudinary configuration is working correctly.');
    })
    .catch(error => {
        console.error('\n❌ Cloudinary test failed:');
        console.error('Error:', error.message);
        console.error('HTTP Code:', error.http_code);
        
        if (error.http_code === 401) {
            console.log('\n🔧 Troubleshooting 401 Error:');
            console.log('1. Check if your Cloudinary account is active');
            console.log('2. Verify your API credentials are correct');
            console.log('3. Ensure your cloud name is not disabled');
            console.log('4. Check if you have sufficient credits/quota');
            console.log('5. Try logging into your Cloudinary dashboard');
        }
        
        if (error.http_code === 403) {
            console.log('\n🔧 Troubleshooting 403 Error:');
            console.log('1. Check if your API key has upload permissions');
            console.log('2. Verify your account is not suspended');
            console.log('3. Check if you have exceeded upload limits');
        }
        
        console.log('\n📞 For additional help:');
        console.log('- Visit: https://cloudinary.com/documentation');
        console.log('- Check your Cloudinary dashboard');
        console.log('- Contact Cloudinary support');
    }); 