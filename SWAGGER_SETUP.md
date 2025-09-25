# Swagger Documentation Setup - Pivora Trading API

## Overview

This document outlines the comprehensive Swagger documentation that has been created for the Pivora Trading API. The documentation covers all endpoints across authentication, user operations, and admin functions.

## What Was Implemented

### 1. Swagger Configuration (`swagger.js`)
- **OpenAPI 3.0.0** specification
- **Comprehensive schemas** for all data models
- **Security schemes** for JWT authentication
- **Server configurations** for development and production
- **Detailed component definitions** for reusability

### 2. Route Documentation

#### Authentication Routes (`/api/auth`)
- ✅ `POST /signup` - User registration
- ✅ `POST /login` - User login
- ✅ `POST /forgot-password` - Password reset OTP
- ✅ `POST /reset-password` - Password reset
- ✅ `GET /verify-email` - Email verification OTP request
- ✅ `POST /verify-email` - Email verification

#### User Routes (`/api/user`)
- ✅ `GET /profile` - Get user profile
- ✅ `POST /deposit` - Create deposit request (with file upload)
- ✅ `POST /withdraw` - Create withdrawal request
- ✅ `GET /deposit-addresses` - Get deposit addresses
- ✅ `GET /withdrawal-addresses` - Get withdrawal addresses
- ✅ `GET /balances` - Get user balances
- ✅ `GET /transactions` - Get transaction history
- ✅ `GET /charges` - Get platform charges

#### Admin Routes (`/api/admin`)
- ✅ `GET /deposits` - Get all deposit requests (with filtering)
- ✅ `PUT /deposits/:id/status` - Update deposit status
- ✅ `GET /withdrawals` - Get all withdrawal requests (with filtering)
- ✅ `PUT /withdrawals/:id/status` - Update withdrawal status
- ✅ `GET /transactions` - Get all transactions (with filtering)
- ✅ `GET /balance` - Get total platform balance
- ✅ `GET /users` - Get all users
- ✅ `GET /deposit-addresses` - Get all deposit addresses
- ✅ `GET /withdrawal-addresses` - Get all withdrawal addresses
- ✅ `POST /addresses` - Update platform addresses
- ✅ `GET /charges` - Get all charges
- ✅ `POST /charges` - Update platform charges

### 3. Data Models Documented
- **User** - User profile information
- **DepositRequest** - Deposit transaction details
- **WithdrawRequest** - Withdrawal transaction details
- **Balance** - User balance information
- **Address** - Cryptocurrency addresses
- **Charges** - Platform fee structure
- **Error** - Standard error response
- **Success** - Standard success response

### 4. Server Integration (`index.js`)
- **Swagger UI** served at `/api-docs`
- **Custom styling** and configuration
- **Interactive testing** capabilities
- **Authorization support** for JWT tokens

### 5. Testing & Validation
- **Swagger configuration test** (`test_swagger.js`)
- **24 endpoints** documented and validated
- **8 schemas** defined and tested
- **Security schemes** properly configured

## Features Included

### 🔐 Authentication
- JWT Bearer token authentication
- Secure endpoint protection
- Authorization button in Swagger UI

### 📝 Request/Response Examples
- Detailed request body schemas
- Response examples for all endpoints
- Error response documentation
- File upload specifications

### 🔍 Query Parameters
- Filtering options for admin endpoints
- Pagination support documentation
- Search and sort parameters

### 📊 Data Validation
- Required field specifications
- Data type validation
- Enum value restrictions
- Format validation (email, date-time, etc.)

### 🎨 User Experience
- Organized endpoint grouping (Auth, User, Admin)
- Clear descriptions and summaries
- Interactive "Try it out" functionality
- Persistent authorization

## Usage Instructions

### Starting the Server
```bash
# Standard start
npm start

# Start with documentation info
npm run docs

# Test Swagger configuration only
npm run test-swagger
```

### Accessing Documentation
1. Start the server: `npm start`
2. Open browser: `http://localhost:5000/api-docs`
3. Use "Try it out" to test endpoints
4. Click "Authorize" for authenticated endpoints

### Authentication Flow
1. Use `/api/auth/login` to get JWT token
2. Click "Authorize" in Swagger UI
3. Enter: `Bearer YOUR_JWT_TOKEN`
4. Test protected endpoints

## File Structure

```
Pivora Trading/
├── swagger.js              # Swagger configuration
├── index.js                # Server with Swagger UI
├── routes/
│   ├── auth.js            # Auth routes with docs
│   ├── user.js            # User routes with docs
│   └── admin.js           # Admin routes with docs
├── test_swagger.js        # Swagger validation test
├── start_with_docs.js     # Server startup with docs info
├── README.md              # Updated with API docs info
└── SWAGGER_SETUP.md       # This documentation
```

## Endpoint Summary

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Authentication** | 6 | User registration, login, password reset, email verification |
| **User Operations** | 8 | Profile, deposits, withdrawals, balances, transactions |
| **Admin Management** | 12 | Platform management, user oversight, transaction processing |

## Technical Details

### Dependencies Used
- `swagger-jsdoc`: Generate OpenAPI specs from JSDoc comments
- `swagger-ui-express`: Serve interactive documentation

### OpenAPI Features
- **Version**: 3.0.0
- **Security**: Bearer token authentication
- **File Upload**: Multipart form data support
- **Response Codes**: 200, 201, 400, 401, 403, 404, 413, 500
- **Data Types**: JSON, multipart/form-data

### Customization
- Custom CSS for Swagger UI
- Persistent authorization
- Interactive testing enabled
- Request duration display
- Filter and search capabilities

## Benefits

1. **Developer Experience**: Interactive API testing
2. **Documentation**: Always up-to-date with code
3. **Onboarding**: Easy for new developers
4. **Testing**: Built-in endpoint testing
5. **Standards**: OpenAPI 3.0 compliance
6. **Maintenance**: Auto-generated from code comments

## Next Steps

The Swagger documentation is now complete and ready for use. Developers can:

1. **Test endpoints** directly from the documentation
2. **Generate client SDKs** using the OpenAPI spec
3. **Integrate with tools** like Postman or Insomnia
4. **Automate testing** using the documented schemas
5. **Onboard new team members** with interactive docs

## Support

For questions about the API documentation:
- Check the interactive docs at `/api-docs`
- Review the README.md file
- Test the configuration with `npm run test-swagger` 