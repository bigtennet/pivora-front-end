# Environment Variables Setup Guide

## 🔧 Required Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=your_mongodb_connection_string_here

# JWT Secret
SECRET_KEY=your_jwt_secret_key_here

# Application URLs
WEB_BASE_URL=http://localhost:3000
SERVER_URL=http://localhost:5000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (if using nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Twilio Configuration (if using SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## 🚀 Quick Setup Steps

### 1. **Get Cloudinary Credentials**
1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Sign up or log in
3. Copy your:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 2. **Create .env File**
```bash
# In your project root directory
touch .env
```

### 3. **Add Your Credentials**
Replace the placeholder values in the .env file with your actual credentials.

### 4. **Test Configuration**
```bash
npm run test-cloudinary
```

## 🔍 Troubleshooting

### If you get "cloud_name is disabled":
1. **Check your Cloudinary account status**
2. **Verify your credentials are correct**
3. **Ensure your account is active**
4. **Check if you have sufficient credits**

### If you don't have Cloudinary:
1. **Sign up for free**: [Cloudinary.com](https://cloudinary.com)
2. **Free tier includes**: 25GB storage, 25GB bandwidth/month
3. **No credit card required** for basic plan

## 🛡️ Security Notes

- **Never commit .env files** to version control
- **Use strong, unique secrets** for production
- **Rotate credentials** regularly
- **Use environment-specific configurations**

## 📞 Support

- **Cloudinary Support**: [support.cloudinary.com](https://support.cloudinary.com)
- **Documentation**: [cloudinary.com/documentation](https://cloudinary.com/documentation) 