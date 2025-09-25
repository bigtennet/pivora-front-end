require('dotenv').config();
const { uploadToCloudinary } = require('./middleware/cloudinary');
const fs = require('fs');
const path = require('path');

async function testCloudinaryUpload() {
    console.log('🧪 Testing Cloudinary Upload...');
    
    // Check environment variables
    console.log('Environment Variables:');
    console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing');
    console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing');
    console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImagePath = path.join(__dirname, 'test_image.png');
    
    // Create a minimal PNG file (1x1 pixel, transparent)
    const pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, // width: 1
        0x00, 0x00, 0x00, 0x01, // height: 1
        0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
        0x1F, 0x15, 0xC4, 0x89, // CRC
        0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
        0x49, 0x44, 0x41, 0x54, // IDAT
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
        0xE2, 0x21, 0xBC, 0x33, // CRC
        0x00, 0x00, 0x00, 0x00, // IEND chunk length
        0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    try {
        // Write test image
        fs.writeFileSync(testImagePath, pngData);
        console.log('✅ Test image created:', testImagePath);
        
        // Test upload
        const uploadOptions = {
            folder: 'Pivora Trading/test',
            public_id: `test_upload_${Date.now()}`,
            overwrite: true
        };
        
        console.log('📤 Uploading test image...');
        const result = await uploadToCloudinary(testImagePath, uploadOptions);
        
        console.log('✅ Upload successful!');
        console.log('Public ID:', result.public_id);
        console.log('Secure URL:', result.secure_url);
        console.log('URL:', result.url);
        
        // Clean up test file
        fs.unlinkSync(testImagePath);
        console.log('✅ Test file cleaned up');
        
        return result;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Clean up test file if it exists
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
            console.log('✅ Test file cleaned up');
        }
        
        throw error;
    }
}

// Run the test
if (require.main === module) {
    testCloudinaryUpload()
        .then(() => {
            console.log('🎉 Cloudinary test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Cloudinary test failed:', error.message);
            process.exit(1);
        });
}

module.exports = { testCloudinaryUpload }; 