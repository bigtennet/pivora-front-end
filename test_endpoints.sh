#!/bin/bash

# Pivora Trading API Endpoint Testing Script
# Usage: ./test_endpoints.sh

BASE_URL="http://localhost:5000"
TOKEN=""
ADMIN_TOKEN=""

echo "🚀 Pivora Trading API Endpoint Testing"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo -e "${BLUE}=== $1 ===${NC}"
    echo ""
}

# Function to print test results
print_test() {
    echo -e "${YELLOW}Testing: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ Success${NC}"
}

print_error() {
    echo -e "${RED}❌ Error${NC}"
}

# ============================================================================
# 1. AUTHENTICATION ENDPOINTS
# ============================================================================

print_section "AUTHENTICATION ENDPOINTS"

# 1.1 User Registration
print_test "User Registration"
curl -s -X POST $BASE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }' | jq '.'
echo ""

# 1.2 User Login
print_test "User Login"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }')
echo $LOGIN_RESPONSE | jq '.'

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"
echo ""

# 1.3 Forgot Password
print_test "Forgot Password"
curl -s -X POST $BASE_URL/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }' | jq '.'
echo ""

# 1.4 Reset Password
print_test "Reset Password"
curl -s -X POST $BASE_URL/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456",
    "newPassword": "newpassword123"
  }' | jq '.'
echo ""

# 1.5 Send Email Verification OTP
print_test "Send Email Verification OTP"
curl -s -X GET $BASE_URL/api/auth/verify-email \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 1.6 Verify Email with OTP
print_test "Verify Email with OTP"
curl -s -X POST $BASE_URL/api/auth/verify-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "123456"
  }' | jq '.'
echo ""

# ============================================================================
# 2. USER ENDPOINTS (Require Authentication)
# ============================================================================

print_section "USER ENDPOINTS"

# 2.1 Get User Balances
print_test "Get User Balances"
curl -s -X GET $BASE_URL/api/user/balances \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 2.2 Get Deposit Addresses
print_test "Get Deposit Addresses"
curl -s -X GET $BASE_URL/api/user/deposit-addresses \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 2.3 Get Withdrawal Addresses
print_test "Get Withdrawal Addresses"
curl -s -X GET $BASE_URL/api/user/withdrawal-addresses \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 2.4 Get Platform Charges
print_test "Get Platform Charges"
curl -s -X GET $BASE_URL/api/user/charges \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 2.5 Get Transaction History
print_test "Get Transaction History"
curl -s -X GET $BASE_URL/api/user/transactions \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 2.6 Create Deposit Request (with file upload)
print_test "Create Deposit Request"
curl -s -X POST $BASE_URL/api/user/deposit \
  -H "Authorization: Bearer $TOKEN" \
  -F "user=USER_ID" \
  -F "currency=BTC" \
  -F "network=Bitcoin" \
  -F "amount=0.001" \
  -F "screenshot=@/path/to/screenshot.jpg" | jq '.'
echo ""

# 2.7 Create Withdrawal Request
print_test "Create Withdrawal Request"
curl -s -X POST $BASE_URL/api/user/withdraw \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user": "USER_ID",
    "currency": "BTC",
    "network": "Bitcoin",
    "withdrawalAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "amount": 0.001
  }' | jq '.'
echo ""

# 2.8 Submit Trading Order
print_test "Submit Trading Order"
curl -s -X POST $BASE_URL/api/user/submit-order \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "direction": "long",
    "ticker": "BTC/USDT"
  }' | jq '.'
echo ""

# 2.9 Get Active Orders
print_test "Get Active Orders"
curl -s -X GET $BASE_URL/api/user/active-orders \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 2.10 Get Order History
print_test "Get Order History"
curl -s -X GET $BASE_URL/api/user/order-history \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 2.11 Close Order
print_test "Close Order"
curl -s -X PUT $BASE_URL/api/user/close-order/ORDER_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# ============================================================================
# 3. ADMIN ENDPOINTS (Require Admin Authentication)
# ============================================================================

print_section "ADMIN ENDPOINTS"

# Note: You need to login as admin user first to get ADMIN_TOKEN
echo "Note: Replace ADMIN_JWT_TOKEN with actual admin user token"
echo ""

# 3.1 Get All Deposit Requests
print_test "Get All Deposit Requests"
curl -s -X GET $BASE_URL/api/admin/deposits \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" | jq '.'
echo ""

# 3.2 Get Deposit Requests with Filters
print_test "Get Deposit Requests with Filters"
curl -s -X GET "$BASE_URL/api/admin/deposits?status=pending&currency=BTC&network=Bitcoin" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" | jq '.'
echo ""

# 3.3 Update Deposit Request Status
print_test "Update Deposit Request Status"
curl -s -X PUT $BASE_URL/api/admin/deposits/DEPOSIT_ID/status \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }' | jq '.'
echo ""

# 3.4 Get All Withdrawal Requests
print_test "Get All Withdrawal Requests"
curl -s -X GET $BASE_URL/api/admin/withdrawals \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" | jq '.'
echo ""

# 3.5 Get Withdrawal Requests with Filters
print_test "Get Withdrawal Requests with Filters"
curl -s -X GET "$BASE_URL/api/admin/withdrawals?status=pending&currency=ETH&network=Ethereum" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" | jq '.'
echo ""

# 3.6 Update Withdrawal Request Status
print_test "Update Withdrawal Request Status"
curl -s -X PUT $BASE_URL/api/admin/withdrawals/WITHDRAWAL_ID/status \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }' | jq '.'
echo ""

# 3.7 Get Transaction History (Admin)
print_test "Get Transaction History (Admin)"
curl -s -X GET $BASE_URL/api/admin/transactions \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" | jq '.'
echo ""

# 3.8 Get Transaction History with Filters
print_test "Get Transaction History with Filters"
curl -s -X GET "$BASE_URL/api/admin/transactions?type=deposit&status=completed&currency=BTC" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" | jq '.'
echo ""

# 3.9 Get Total Platform Balance
print_test "Get Total Platform Balance"
curl -s -X GET $BASE_URL/api/admin/balance \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" | jq '.'
echo ""

# 3.10 Get All Users
print_test "Get All Users"
curl -s -X GET $BASE_URL/api/admin/users \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" | jq '.'
echo ""

# 3.11 Get Users with Email Filter
print_test "Get Users with Email Filter"
curl -s -X GET "$BASE_URL/api/admin/users?email=john" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" | jq '.'
echo ""

# 3.12 Get Admin Deposit Addresses
print_test "Get Admin Deposit Addresses"
curl -s -X GET $BASE_URL/api/admin/deposit-addresses \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" | jq '.'
echo ""

# 3.13 Get Admin Withdrawal Addresses
print_test "Get Admin Withdrawal Addresses"
curl -s -X GET $BASE_URL/api/admin/withdrawal-addresses \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" | jq '.'
echo ""

# 3.14 Add/Update Address
print_test "Add/Update Address"
curl -s -X POST $BASE_URL/api/admin/addresses \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "network": "Bitcoin",
    "currency": "BTC",
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "type": "deposit"
  }' | jq '.'
echo ""

# 3.15 Get Admin Charges
print_test "Get Admin Charges"
curl -s -X GET $BASE_URL/api/admin/charges \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" | jq '.'
echo ""

# 3.16 Add/Update Charge
print_test "Add/Update Charge"
curl -s -X POST $BASE_URL/api/admin/charges \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "withdraw",
    "chargePercentage": 2.5
  }' | jq '.'
echo ""

# ============================================================================
# 4. BASE ENDPOINT
# ============================================================================

print_section "BASE ENDPOINT"

# 4.1 API Status
print_test "API Status"
curl -s -X GET $BASE_URL/ | jq '.'
echo ""

# ============================================================================
# 5. TESTING NOTES
# ============================================================================

print_section "TESTING NOTES"

echo "📝 Important Notes:"
echo "1. Replace placeholders:"
echo "   - USER_ID: Use actual user ID from database"
echo "   - DEPOSIT_ID: Use actual deposit request ID"
echo "   - WITHDRAWAL_ID: Use actual withdrawal request ID"
echo "   - ADMIN_JWT_TOKEN: Use admin user's token"
echo "   - /path/to/screenshot.jpg: Use actual file path"
echo ""
echo "2. Admin Access Setup:"
echo "   - Set ADMIN_EMAIL in .env file"
echo "   - Or add isAdmin: true to user document"
echo ""
echo "3. Testing Order:"
echo "   - Start with authentication endpoints"
echo "   - Get tokens from login responses"
echo "   - Use tokens for protected endpoints"
echo "   - Test admin endpoints with admin user"
echo ""
echo "4. File Upload:"
echo "   - For deposit requests, ensure file exists at specified path"
echo "   - Supported formats: JPEG, PNG, WebP"
echo ""
echo "5. Database Setup:"
echo "   - Ensure MongoDB is running"
echo "   - Create necessary collections and indexes"
echo ""

echo -e "${GREEN}✅ Testing script completed!${NC}"
echo ""
echo "To run individual tests, copy the specific curl command from above." 