# Pivora Trading API

A comprehensive cryptocurrency trading platform API built with Node.js, Express, and MongoDB.

## Features

- **User Authentication**: Secure JWT-based authentication with email verification
- **Cryptocurrency Management**: Support for multiple cryptocurrencies and networks
- **Deposit & Withdrawal**: Complete deposit and withdrawal request system
- **Balance Management**: Real-time balance tracking for users
- **Admin Panel**: Comprehensive admin interface for managing the platform
- **File Upload**: Secure file upload for transaction screenshots
- **Email Notifications**: Automated email notifications for users

## API Documentation

The API documentation is available via Swagger UI at `/api-docs` when the server is running.

### Accessing the Documentation

1. Start the server: `npm start`
2. Open your browser and navigate to: `http://localhost:5000/api-docs`

### Authentication

Most endpoints require authentication using JWT tokens. To authenticate:

1. Use the `/api/auth/login` endpoint to get a JWT token
2. Click the "Authorize" button in Swagger UI
3. Enter your token in the format: `Bearer YOUR_JWT_TOKEN`
4. Click "Authorize"

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register a new user |
| POST | `/login` | Login user |
| POST | `/forgot-password` | Send password reset OTP |
| POST | `/reset-password` | Reset password using OTP |
| GET | `/verify-email` | Request email verification OTP |
| POST | `/verify-email` | Verify email using OTP |

### User Endpoints (`/api/user`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| POST | `/deposit` | Create deposit request |
| POST | `/withdraw` | Create withdrawal request |
| GET | `/deposit-addresses` | Get deposit addresses |
| GET | `/withdrawal-addresses` | Get withdrawal addresses |
| GET | `/balances` | Get user balances |
| GET | `/transactions` | Get transaction history |
| GET | `/charges` | Get platform charges |

### Admin Endpoints (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/deposits` | Get all deposit requests |
| PUT | `/deposits/:id/status` | Update deposit status |
| GET | `/withdrawals` | Get all withdrawal requests |
| PUT | `/withdrawals/:id/status` | Update withdrawal status |
| GET | `/transactions` | Get all transactions |
| GET | `/balance` | Get total platform balance |
| GET | `/users` | Get all users |
| GET | `/deposit-addresses` | Get all deposit addresses |
| GET | `/withdrawal-addresses` | Get all withdrawal addresses |
| POST | `/addresses` | Update platform addresses |
| GET | `/charges` | Get all charges |
| POST | `/charges` | Update platform charges |

## Data Models

### User
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "fullName": "John Doe",
  "email": "john@example.com",
  "emailVerified": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Deposit Request
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "user": "507f1f77bcf86cd799439011",
  "currency": "BTC",
  "network": "Bitcoin",
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "amount": 0.001,
  "screenshot": "https://res.cloudinary.com/...",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Withdrawal Request
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "user": "507f1f77bcf86cd799439011",
  "currency": "BTC",
  "network": "Bitcoin",
  "amount": 0.001,
  "finalAmount": 0.00095,
  "serviceCharge": 0.05,
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Myles181/Pivora Trading.git
cd Pivora Trading
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret_key
WEB_BASE_URL=http://localhost:3000
SERVER_URL=http://localhost:5000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

4. Start the development server:
```bash
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `MONGO_URI` | MongoDB connection string | Yes |
| `SECRET_KEY` | JWT secret key | Yes |
| `WEB_BASE_URL` | Frontend URL | Yes |
| `SERVER_URL` | Backend URL | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |

## Usage Examples

### Creating a Deposit Request

```javascript
const formData = new FormData();
formData.append('user', '507f1f77bcf86cd799439011');
formData.append('currency', 'BTC');
formData.append('network', 'Bitcoin');
formData.append('amount', '0.001');
formData.append('screenshot', fileInput.files[0]);

const response = await fetch('/api/user/deposit', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
});
```

### Creating a Withdrawal Request

```javascript
const response = await fetch('/api/user/withdraw', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    user: '507f1f77bcf86cd799439011',
    currency: 'BTC',
    network: 'Bitcoin',
    withdrawalAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    amount: 0.001
  })
});
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `413` - File Too Large
- `500` - Internal Server Error

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Helmet security headers
- File upload validation
- Input sanitization
- Rate limiting (can be added)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support, email support@Pivora Trading.com or create an issue in the GitHub repository. 