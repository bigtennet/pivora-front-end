const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload file
const uploadToCloudinary = async (filePath, options = {}) => {
    try {
        console.log('🔍 Cloudinary Upload Debug:');
        console.log('File path:', filePath);
        
        // Check if file exists
        const fs = require('fs');
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found at path: ${filePath}`);
        }
        
        const fileStats = fs.statSync(filePath);
        console.log('File exists:', true);
        console.log('File stats:', {
            size: fileStats.size,
            created: fileStats.birthtime,
            modified: fileStats.mtime
        });
        console.log('Options:', JSON.stringify(options, null, 2));
        
        // Check Cloudinary configuration
        const config = cloudinary.config();
        console.log('Cloudinary config:', {
            cloud_name: config.cloud_name,
            api_key: config.api_key ? 'Set' : 'Missing',
            api_secret: config.api_secret ? 'Set' : 'Missing'
        });

        // Validate required config
        if (!config.cloud_name || !config.api_key || !config.api_secret) {
            throw new Error('Cloudinary configuration is incomplete. Please check your environment variables.');
        }

        // Test Cloudinary connection first
        console.log('🧪 Testing Cloudinary connection...');
        const pingResult = await cloudinary.api.ping();
        console.log('Ping result:', pingResult);

        console.log('📤 Starting upload...');
        const uploadOptions = {
            folder: options.folder || 'uploads', // Default folder
            resource_type: options.resource_type || 'auto',
            ...options
        };
        
        console.log('Final upload options:', JSON.stringify(uploadOptions, null, 2));
        
        const result = await cloudinary.uploader.upload(filePath, uploadOptions);
        
        console.log('✅ Cloudinary upload successful:');
        console.log('Public ID:', result.public_id);
        console.log('Secure URL:', result.secure_url);
        console.log('URL:', result.url);
        console.log('Format:', result.format);
        console.log('Size:', result.bytes);
        
        // Test if the URL is accessible
        console.log('🔗 Testing URL accessibility...');
        try {
            const https = require('https');
            const url = new URL(result.secure_url);
            const response = await new Promise((resolve, reject) => {
                const req = https.get(url, (res) => {
                    console.log('URL test status:', res.statusCode);
                    resolve(res.statusCode);
                });
                req.setTimeout(10000, () => {
                    req.destroy();
                    reject(new Error('URL test timeout'));
                });
                req.on('error', (err) => {
                    console.log('URL test error:', err.message);
                    reject(err);
                });
            });
            console.log('✅ URL is accessible (status:', response, ')');
        } catch (urlError) {
            console.log('❌ URL test failed:', urlError.message);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            statusCode: error.http_code,
            response: error.response,
            stack: error.stack
        });
        
        // Provide more specific error messages
        if (error.message.includes('File not found')) {
            throw new Error(`Upload failed: ${error.message}`);
        } else if (error.http_code === 401) {
            throw new Error('Upload failed: Invalid Cloudinary credentials. Please check your API key and secret.');
        } else if (error.http_code === 400) {
            throw new Error(`Upload failed: Invalid request. ${error.message}`);
        } else if (error.http_code === 413) {
            throw new Error('Upload failed: File too large for Cloudinary.');
        } else {
            throw new Error(`Upload failed: ${error.message}`);
        }
    }
};

// Helper function to delete file
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    deleteFromCloudinary
};