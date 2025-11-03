# Parrit

Voice Activated Finance Tracker

## Architecture Overview

This application follows a **Three-Layer Architecture** pattern for better separation of concerns, maintainability, and testability:

### 🏗️ Three-Layer Architecture

1. **Presentation Layer (Routes)** - `src/routes/`
   - Handles HTTP requests and responses
   - Input validation using **Zod** schemas
   - HTTP status codes and error formatting
   - Swagger documentation
   - **No business logic or database operations**

2. **Business Logic Layer (Services)** - `src/services/`
   - Implements business rules and validations
   - Data transformation and formatting
   - Orchestrates complex operations
   - Handles business-specific errors
   - **No HTTP concerns or direct database access**

3. **Data Access Layer (Repositories)** - `src/repositories/`
   - Encapsulates all database operations
   - CRUD operations and complex queries
   - Database connection management
   - Data mapping between database and application models
   - **No business logic or HTTP concerns**

### Why This Architecture?

- **Separation of Concerns**: Each layer has a single, well-defined responsibility
- **Testability**: Each layer can be tested independently with mocks
- **Maintainability**: Changes are isolated to the appropriate layer
- **Scalability**: Easy to add caching, switch databases, or modify business rules
- **Code Reusability**: Services can be used by different routes or other services
- **Clean Code**: Promotes SOLID principles and clean code practices

## 🔐 Authentication & Authorization

Parrit implements a robust authentication and authorization system using **Firebase JWT tokens** with custom claims for fine-grained access control.

### Security Architecture

```
Client (React Native)
      ↓
   Firebase Auth (Email/Password)
      ↓
   JWT Token (contains uid)
      ↓
   POST /api/v1/profiles + JWT
      ↓
   authenticateToken middleware
      ↓
   ProfileService.createProfile()
      ↓
   Firebase Admin SDK: setCustomClaims(uid, {userId: mongoId})
      ↓
   Client refreshes JWT (now includes userId custom claim)
      ↓
   Protected API Endpoints
      ↓
   authenticateToken → requireSameUser → Route Handler
```

### Key Components

#### 1. **Firebase Admin SDK** (`src/config/firebase-admin.ts`)
- Verifies JWT tokens from Firebase Authentication
- Sets custom claims (`userId`) on Firebase users
- Provides secure server-side authentication

#### 2. **Authentication Middleware** (`src/middleware/auth.middleware.ts`)
- **`authenticateToken`**: Validates JWT from `Authorization: Bearer <token>` header
- **`requireSameUser(paramName)`**: Ensures JWT `userId` matches URL parameter
- Returns 401 Unauthorized for auth failures

#### 3. **Custom Claims**
- **`uid`**: Firebase user ID (always present in JWT)
- **`userId`**: MongoDB profile ID (added after profile creation)
- Enables resource-level authorization

### Authentication vs Authorization

- **Authentication** (🔑): Verifying the user's identity (valid JWT token)
- **Authorization** (🚪): Ensuring the user has permission to access a specific resource (userId matches)

### Protected Endpoints

All API endpoints except profile creation require:
1. **Valid JWT token** in Authorization header
2. **userId custom claim** in the token
3. **Matching userId** between JWT and URL path parameter

**Example**:
```bash
# ✅ Authorized: JWT userId matches URL userId
GET /api/v1/users/123/budgets
Authorization: Bearer <jwt-with-userId-123>

# ❌ Unauthorized: JWT userId doesn't match URL userId
GET /api/v1/users/456/budgets
Authorization: Bearer <jwt-with-userId-123>
```

### Security Features

- ✅ JWT token verification with Firebase Admin SDK
- ✅ Bearer token authentication
- ✅ Custom claims for authorization
- ✅ Resource-level access control (@SameUser pattern)
- ✅ Automatic firebaseUid storage in user profiles
- ✅ Token expiration handling
- ✅ Comprehensive error messages for debugging

### 🛡️ Schema Validation with Zod

The application uses **[Zod](https://zod.dev/)** for runtime type validation and schema definition:

- **Type Safety**: Automatically infer TypeScript types from Zod schemas
- **Runtime Validation**: Validate incoming request data at runtime
- **Clear Error Messages**: Provide detailed validation error messages to clients
- **Schema Reusability**: Define schemas once, use for validation and type inference
- **API Documentation**: Zod schemas integrate with Swagger/OpenAPI generation

**Example Usage**:
```typescript
// Define schema in model
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  userId: z.string()
});

// Validate in route
const result = CategorySchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ error: result.error });
}
```

## 🔄 Authentication Workflow

### Complete User Registration Flow

#### Step 1: User Signs Up with Firebase
```javascript
// Client-side (React Native)
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();
```

**JWT contains**: `{ uid: "firebase-user-id", email: "user@example.com" }`
**Missing**: `userId` custom claim (not created yet)

#### Step 2: Check Registration Status
```bash
POST /api/v1/login
Authorization: Bearer <jwt-token>
```

**Backend Response**:
- **200 OK** with profile data → User already registered, proceed to app
- **404 Not Found** → First time user, proceed to Step 3
- **401 Unauthorized** → Token issue, re-authenticate with Firebase

**Example 404 Response (First Time User)**:
```json
{
  "error": "User not found",
  "message": "First time login",
  "firebaseUid": "firebase-user-id"
}
```

#### Step 3: Create Profile (First-Time Only)
```bash
POST /api/v1/profiles
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "birthday": "01/15",
  "email": "john@example.com",
  "phoneNumber": "+1234567890"
}
```

**Backend Process**:
1. `authenticateToken` verifies JWT and extracts `firebaseUid`
2. Profile created in MongoDB with `firebaseUid`
3. Firebase Admin sets custom claim: `setCustomUserClaims(firebaseUid, { userId: mongoProfileId })`
4. Profile returned to client

**Response**:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "firebaseUid": "firebase-user-id",
  "firstName": "John",
  "lastName": "Doe",
  ...
}
```

#### Step 4: Refresh JWT Token (Client-Side)
```javascript
// Force token refresh to get updated custom claims
const refreshedToken = await user.getIdToken(true);
```

**New JWT contains**: `{ uid: "firebase-user-id", userId: "507f1f77bcf86cd799439011", email: "..." }`
**Now includes**: `userId` custom claim! ✅

#### Step 5: Access Protected Resources
```bash
GET /api/v1/profiles/507f1f77bcf86cd799439011
Authorization: Bearer <refreshed-jwt-token>
```

**Backend Process**:
1. `authenticateToken` verifies JWT ✅
2. `requireSameUser('id')` checks: JWT userId === URL id ✅
3. Return profile data

### Subsequent Logins

For users who already have a profile:

```javascript
// 1. Sign in with Firebase
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// 2. Get ID token (already includes userId custom claim)
const idToken = await user.getIdToken();

// 3. Check login status
const response = await fetch('http://localhost:3000/api/v1/login', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${idToken}` }
});

const data = await response.json();

if (response.status === 200) {
  // User exists - proceed to app with profile data
  console.log('Welcome back!', data.profile);
} else if (response.status === 404) {
  // First time user - show registration screen
  console.log('Please complete registration');
}

// 4. Use token for all API requests!
```

### Token Lifecycle

- **Token Expiration**: Firebase JWT tokens expire after 1 hour
- **Auto-Refresh**: Firebase SDK automatically refreshes tokens
- **Manual Refresh**: Call `getIdToken(true)` to force refresh
- **Custom Claims**: Included in token after refresh (step 3 above)

### Error Handling

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| `No token provided` | 401 | Missing Authorization header | Add `Authorization: Bearer <token>` |
| `Invalid token` | 401 | Malformed JWT token | Get a new token from Firebase |
| `Token expired` | 401 | JWT token older than 1 hour | Refresh token: `await user.getIdToken(true)` |
| `Unauthorized access` | 401 | JWT userId ≠ URL userId | Use correct userId in URL |
| `User not found` | 404 | First time login (no userId claim or profile missing) | Complete profile registration |
| `User not fully registered` | 401 | Missing userId custom claim | Complete profile creation, refresh token |

## Environment Variables

Before running the application, you need to configure environment variables:

### Required Variables

Create a `.env` file in the `server/` directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=parrit

# Firebase Service Account (entire JSON as single-line string)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",...}
```

### Getting Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate New Private Key"**
5. Download the JSON file
6. Copy the entire JSON content as a single line (remove line breaks)
7. Paste into `.env` as `FIREBASE_SERVICE_ACCOUNT=...`

### Security Note

⚠️ **NEVER commit your `.env` file to Git!** It contains sensitive credentials.

The `.env` file is already in `.gitignore` to prevent accidental commits.

## Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)
- MongoDB (v6.0 or higher) - Can be run locally or in Docker

## MongoDB Setup

### Run MongoDB in Docker 

1. **Pull and run MongoDB container**:
```bash
# Pull the official MongoDB image
docker pull mongo:latest

# Run MongoDB container
docker run -d \
  --name parrit-mongodb \
  -p 27017:27017 \
  -v parrit-mongo-data:/data/db \
  mongo:latest
```

2. **Verify MongoDB is running**:
```bash
# Check container status
docker ps | grep parrit-mongodb

# View MongoDB logs
docker logs parrit-mongodb

# Connect to MongoDB shell (optional)
docker exec -it parrit-mongodb mongosh
```

3. **Stop/Start MongoDB container**:
```bash
# Stop the container
docker stop parrit-mongodb

# Start the container again
docker start parrit-mongodb

# Remove container (data persists in volume)
docker rm parrit-mongodb
```

### MongoDB Connection

The application connects to MongoDB at:
- **Default URL**: `mongodb://localhost:27017`
- **Database Name**: `parrit`
- **No authentication required** for local development

You can override these with environment variables:
```bash
export MONGODB_URI=mongodb://localhost:27017
export DATABASE_NAME=parrit
```

### MongoDB Compass (Visual Client)

**MongoDB Compass** is the official GUI client for MongoDB that allows you to visually explore your database, collections, and documents.

1. **Download MongoDB Compass**:
   - Visit [https://www.mongodb.com/try/download/compass](https://www.mongodb.com/try/download/compass)
   - Download and install for your operating system

2. **Connect to your local MongoDB**:
   - Open MongoDB Compass
   - Use connection string: `mongodb://localhost:27017`
   - Click "Connect"

3. **Explore your Parrit database**:
   - You'll see the `parrit` database after creating your first profile
   - Browse the `profiles` collection to see your data
   - View documents, indexes, and collection stats
   - Run queries and aggregations visually

4. **Useful features**:
   - **Documents tab**: View and edit profile documents
   - **Indexes tab**: See the email and createdAt indexes
   - **Schema tab**: Analyze your data structure
   - **Query bar**: Test MongoDB queries before using in code

MongoDB Compass is especially helpful for:
- Debugging data issues
- Understanding your document structure
- Testing queries and aggregations
- Monitoring database performance

## Installation

1. **Clone the repository**:
```bash
git clone https://github.com/shallowsmith/Parrit.git
cd Parrit
```

2. **Install dependencies**:
```bash
npm install
```

3. **Verify MongoDB is running**:
```bash
# Check if MongoDB is accessible
curl http://localhost:27017
# Should return: It looks like you are trying to access MongoDB over HTTP...
```

## Running the Application

### Development Mode
Run with hot reload (uses tsx watch):
```bash
npm run dev
```

The server will:
1. Connect to MongoDB at `mongodb://localhost:27017`
2. Create the `parrit` database (if it doesn't exist)
3. Initialize database indexes
4. Start the Express server on port 3000

You should see:
```
Database connected successfully
Database indexes initialized
Server running at http://localhost:3000
Swagger documentation available at http://localhost:3000/docs
```

### Production Mode
1. **Build the TypeScript code**:
```bash
npm run build
```

2. **Start the production server**:
```bash
npm start
```

### Troubleshooting

**MongoDB Connection Failed**:
```
Error: Failed to connect to MongoDB
```
- Ensure MongoDB is running on port 27017
- Check Docker container status: `docker ps`
- Check MongoDB logs: `docker logs parrit-mongodb`

**Port Already in Use**:
```
Error: listen EADDRINUSE: address already in use :::3000
```
- Kill the process using port 3000: `lsof -ti:3000 | xargs kill -9`
- Or change the port in `src/index.ts`

## API Documentation

### Swagger UI
Interactive API documentation is available at: `http://localhost:3000/docs`

The Swagger documentation provides:
- Complete API reference for all endpoints
- Request/response schemas
- Interactive testing interface
- Example requests and responses

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Authentication Headers

All API requests require a valid Firebase JWT token in the Authorization header:

```bash
Authorization: Bearer <your-firebase-jwt-token>
```

### Login

#### Check User Registration Status
```bash
POST /api/v1/login
Authorization: Bearer <jwt-token>
```

**Purpose**: Determines whether a user has completed profile registration or is logging in for the first time.

**Authorization**: Requires valid JWT token (authentication only, no authorization)

**Response Scenarios**:

**1. Successful Login (Existing User) - 200**
```json
{
  "message": "Login success",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "firebaseUid": "firebase-uid-123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    ...
  }
}
```

**2. First Time Login (New User) - 404**
```json
{
  "error": "User not found",
  "message": "First time login",
  "firebaseUid": "firebase-uid-123"
}
```
*Client should redirect to registration screen*

**3. Missing/Invalid Token - 401**
```json
{
  "error": "No token provided"
}
```
or
```json
{
  "error": "Invalid token"
}
```

**4. Expired Token - 401**
```json
{
  "error": "Token expired"
}
```
*Client should refresh token using Firebase refresh token mechanism*

**Login Flow Logic**:
1. JWT missing/invalid/expired → 401 error
2. JWT valid but no userId claim → 404 "First time login" (show registration)
3. JWT valid with userId but profile doesn't exist in DB → 404 "First time login" (show registration)
4. JWT valid with userId and profile exists → 200 "Login success" (show app)

### Profiles

#### Create Profile (First-Time Registration)
```bash
POST /api/v1/profiles
Authorization: Bearer <jwt-with-firebase-uid>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "birthday": "01/15",
  "email": "john@example.com",
  "phoneNumber": "+1234567890"
}
```

**Authorization**: Requires valid JWT token (but userId custom claim not yet required)
**Note**: After creation, remember to refresh your JWT token to get the userId custom claim

**Required fields**:
- firstName
- lastName
- birthday (format: mm/dd)
- email
- phoneNumber

**Optional fields**: profileImage, nickname, status

#### Get All Profiles
```bash
GET /api/v1/profiles
Authorization: Bearer <jwt-with-userId>
```

**Authorization**: Requires JWT with userId custom claim

#### Get Profile by ID
```bash
GET /api/v1/profiles/:id
Authorization: Bearer <jwt-with-userId>
```

**Authorization**: Requires JWT with userId custom claim + @SameUser (id must match JWT userId)

#### Update Profile
```bash
PUT /api/v1/profiles/:id
Authorization: Bearer <jwt-with-userId>
Content-Type: application/json

{
  "firstName": "Jane",
  "phoneNumber": "+0987654321"
}
```

**Authorization**: Requires JWT with userId custom claim + @SameUser (id must match JWT userId)

### Budgets

All budget endpoints require authentication and @SameUser authorization (userId in JWT must match userId in URL).

#### Get All Budgets
```bash
GET /api/v1/users/:userId/budgets
Authorization: Bearer <jwt-with-userId>
```

**Authorization**: Requires JWT + @SameUser (userId parameter must match JWT userId)

#### Get Budget by ID
```bash
GET /api/v1/users/:userId/budgets/:budgetId
Authorization: Bearer <jwt-with-userId>
```

**Authorization**: Requires JWT + @SameUser (userId parameter must match JWT userId)

#### Create Budget
```bash
POST /api/v1/users/:userId/budgets
Authorization: Bearer <jwt-with-userId>
Content-Type: application/json

{
  "month": "January",
  "year": 2025,
  "amount": 5000,
  "remaining": 5000
}
```

**Authorization**: Requires JWT + @SameUser (userId parameter must match JWT userId)

**Required fields**: month, year, amount, remaining

### Categories

All category endpoints require authentication and @SameUser authorization (userId in JWT must match userId in URL).

#### Get All Categories
```bash
GET /api/v1/users/:userId/categories
Authorization: Bearer <jwt-with-userId>
```

#### Get Category by ID
```bash
GET /api/v1/users/:userId/categories/:categoryId
Authorization: Bearer <jwt-with-userId>
```

#### Create Category
```bash
POST /api/v1/users/:userId/categories
Authorization: Bearer <jwt-with-userId>
Content-Type: application/json

{
  "name": "Groceries",
  "type": "expense"
}
```

**Required fields**: name, type

#### Update Category
```bash
PUT /api/v1/users/:userId/categories/:categoryId
Authorization: Bearer <jwt-with-userId>
Content-Type: application/json

{
  "name": "Food & Groceries"
}
```

#### Delete Category
```bash
DELETE /api/v1/users/:userId/categories/:categoryId
Authorization: Bearer <jwt-with-userId>
```

### Transactions

All transaction endpoints require authentication and @SameUser authorization (userId in JWT must match userId in URL).

#### Get All Transactions
```bash
GET /api/v1/users/:userId/transactions
Authorization: Bearer <jwt-with-userId>
```

#### Get Transaction by ID
```bash
GET /api/v1/users/:userId/transactions/:transactionId
Authorization: Bearer <jwt-with-userId>
```

#### Create Transaction
```bash
POST /api/v1/users/:userId/transactions
Authorization: Bearer <jwt-with-userId>
Content-Type: application/json

{
  "vendorName": "Whole Foods",
  "description": "Weekly groceries",
  "dateTime": "2025-10-26T14:30:00Z",
  "amount": 125.50,
  "paymentType": "credit",
  "categoryName": "Groceries"
}
```

**Required fields**: vendorName, description, dateTime, amount, paymentType, categoryName
**Optional fields**: receiptImageUrl

#### Update Transaction
```bash
PUT /api/v1/users/:userId/transactions/:transactionId
Authorization: Bearer <jwt-with-userId>
Content-Type: application/json

{
  "amount": 130.00
}
```

#### Delete Transaction
```bash
DELETE /api/v1/users/:userId/transactions/:transactionId
Authorization: Bearer <jwt-with-userId>
```

### Receipts

All receipt endpoints require authentication and @SameUser authorization (userId in JWT must match userId in URL).

#### Get All Receipts
```bash
GET /api/v1/users/:userId/receipts
Authorization: Bearer <jwt-with-userId>
```

#### Get Receipt by ID
```bash
GET /api/v1/users/:userId/receipts/:receiptId
Authorization: Bearer <jwt-with-userId>
```

#### Create Receipt
```bash
POST /api/v1/users/:userId/receipts
Authorization: Bearer <jwt-with-userId>
Content-Type: application/json

{
  "vendorName": "Target",
  "description": "Home supplies",
  "dateTime": "2025-10-26T10:00:00Z",
  "amount": 75.25,
  "paymentType": "debit",
  "categoryName": "Home",
  "receiptImageUrl": "https://storage.example.com/receipts/abc123.jpg"
}
```

**Required fields**: vendorName, description, dateTime, amount, paymentType, categoryName, receiptImageUrl

#### Update Receipt
```bash
PUT /api/v1/users/:userId/receipts/:receiptId
Authorization: Bearer <jwt-with-userId>
Content-Type: application/json

{
  "amount": 80.00
}
```

#### Delete Receipt
```bash
DELETE /api/v1/users/:userId/receipts/:receiptId
Authorization: Bearer <jwt-with-userId>
```

### Example Error Responses

**401 Unauthorized - Missing Token**:
```json
{
  "error": "No token provided"
}
```

**401 Unauthorized - Invalid Token**:
```json
{
  "error": "Invalid token"
}
```

**401 Unauthorized - User Not Fully Registered**:
```json
{
  "error": "User not fully registered",
  "message": "Please complete profile creation to access this resource"
}
```

**401 Unauthorized - userId Mismatch**:
```json
{
  "error": "Unauthorized access"
}
```

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── database.ts           # MongoDB connection singleton
│   │   ├── firebase-admin.ts     # Firebase Admin SDK initialization and JWT verification
│   │   └── swagger.ts            # Swagger/OpenAPI configuration with auth schemas
│   ├── middleware/
│   │   └── auth.middleware.ts    # JWT authentication and @SameUser authorization
│   ├── types/
│   │   └── express.d.ts          # Extended Express types with JWTPayload interface
│   ├── models/
│   │   ├── Profile.ts            # Profile model with Zod schema (includes firebaseUid)
│   │   ├── Budget.ts             # Budget model with Zod schema
│   │   ├── Category.ts           # Category model with Zod schema
│   │   ├── Transaction.ts        # Transaction model with Zod schema
│   │   └── Receipt.ts            # Receipt model with Zod schema
│   ├── repositories/
│   │   ├── ProfileRepository.ts  # Data access layer for profiles
│   │   ├── BudgetRepository.ts   # Data access layer for budgets
│   │   ├── CategoryRepository.ts # Data access layer for categories
│   │   ├── TransactionRepository.ts # Data access layer for transactions
│   │   └── ReceiptRepository.ts  # Data access layer for receipts
│   ├── services/
│   │   ├── ProfileService.ts     # Business logic for profiles (sets custom claims)
│   │   ├── BudgetService.ts      # Business logic for budgets
│   │   ├── CategoryService.ts    # Business logic for categories
│   │   ├── TransactionService.ts # Business logic for transactions
│   │   └── ReceiptService.ts     # Business logic for receipts
│   ├── routes/
│   │   ├── profile.routes.ts     # Profile REST endpoints (protected with auth middleware)
│   │   ├── budget.routes.ts      # Budget REST endpoints (protected with auth middleware)
│   │   ├── categories.routes.ts  # Category REST endpoints (protected with auth middleware)
│   │   ├── transaction.routes.ts # Transaction REST endpoints (protected with auth middleware)
│   │   └── receipt.routes.ts     # Receipt REST endpoints (protected with auth middleware)
│   └── index.ts                  # Application entry point
├── scripts/
│   └── firebase-login.js         # Firebase authentication testing script
├── .env                          # Environment variables (FIREBASE_SERVICE_ACCOUNT, MONGODB_URI)
└── package.json                  # Dependencies and scripts
```

### Key Design Patterns

- **Singleton Pattern**: Database connection management and Firebase Admin SDK initialization
- **Repository Pattern**: Abstract database operations
- **Service Layer Pattern**: Business logic encapsulation
- **Middleware Chain Pattern**: Sequential authentication and authorization checks
- **Dependency Injection**: Services injected into routes
- **Lazy Initialization**: Database collections initialized on first use
- **Schema Validation**: Zod schemas for runtime type validation and TypeScript type inference
- **Resource-Level Authorization**: @SameUser pattern for fine-grained access control

## Testing Authentication

### Firebase Testing Scripts

The project includes two Node.js scripts for testing Firebase authentication during development:

#### 1. Firebase Sign-Up Script
Creates a new Firebase user with email and password. Use this to quickly create test users without needing the UI.

```bash
# Create a new Firebase user
npm run firebase-signup newuser@example.com SecurePass123

# The script will output:
# - Firebase User ID (uid)
# - JWT Token (use in Authorization header)
# - Token payload and expiration
# - Next steps for profile creation
```

**Requirements**:
- Email must be valid format
- Password must be at least 6 characters (Firebase default)
- Email must not already exist in Firebase

**Use Cases**:
- Creating test users for development
- Automated testing setup
- Quick manual testing without UI

#### 2. Firebase Login Script
Authenticates an existing Firebase user and retrieves their JWT token.

```bash
# Login and get JWT token
npm run firebase-login existing@example.com password123

# The script will output:
# - Firebase User ID (uid)
# - JWT Token (use in Authorization header)
# - Decoded token payload (including custom claims)
# - Token expiration time
```

**Use Cases**:
- Getting fresh JWT tokens for testing
- Verifying custom claims after profile creation
- Testing token expiration and refresh

### Complete Testing Workflow

Here's the end-to-end workflow for testing the full authentication and registration system:

#### Step 1: Create a Test User
```bash
npm run firebase-signup testuser@example.com TestPass123
```

**Expected Output**:
- ✅ User created successfully
- 🎫 JWT Token (copy this for next steps)
- 💡 Instructions for profile creation

#### Step 2: Verify First-Time Login (404 Response)
```bash
# Copy the JWT token from Step 1
curl -X POST http://localhost:3000/api/v1/login \
  -H "Authorization: Bearer <jwt-token-from-step-1>"
```

**Expected Response (404)**:
```json
{
  "error": "User not found",
  "message": "First time login",
  "firebaseUid": "firebase-uid-123"
}
```

This confirms the user exists in Firebase but hasn't created a profile yet.

#### Step 3: Create User Profile
```bash
curl -X POST http://localhost:3000/api/v1/profiles \
  -H "Authorization: Bearer <jwt-token-from-step-1>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "birthday": "01/15",
    "email": "testuser@example.com",
    "phoneNumber": "+1234567890"
  }'
```

**Expected Response (201)**:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "firebaseUid": "firebase-uid-123",
  "firstName": "Test",
  "lastName": "User",
  "email": "testuser@example.com",
  ...
}
```

Behind the scenes, the server has set custom claims on the Firebase user with the userId.

#### Step 4: Get Refreshed Token with Custom Claims
```bash
# Login again to get token with userId custom claim
npm run firebase-login testuser@example.com TestPass123
```

**Expected Output**:
- JWT Token (with userId custom claim)
- Custom Claims section showing: `userId: 507f1f77bcf86cd799439011`

#### Step 5: Verify Successful Login (200 Response)
```bash
curl -X POST http://localhost:3000/api/v1/login \
  -H "Authorization: Bearer <new-jwt-token-from-step-4>"
```

**Expected Response (200)**:
```json
{
  "message": "Login success",
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "Test",
    "lastName": "User",
    ...
  }
}
```

This confirms the complete registration flow is working!

#### Step 6: Test Protected Endpoints
```bash
# Now you can access protected resources
curl http://localhost:3000/api/v1/profiles/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <jwt-token-with-userId>"

# Create a budget
curl -X POST http://localhost:3000/api/v1/users/507f1f77bcf86cd799439011/budgets \
  -H "Authorization: Bearer <jwt-token-with-userId>" \
  -H "Content-Type: application/json" \
  -d '{
    "month": "January",
    "year": 2025,
    "amount": 5000,
    "remaining": 5000
  }'
```

### Manual Testing Workflow (Alternative Method)

If you prefer to use the Firebase Console to create users:

#### 1. Sign Up and Check Login Status
```bash
# First, create a Firebase user through the Firebase Console
# Then use firebase-login script to get initial JWT token
npm run firebase-login john@example.com password123

# Check login status - should return 404 for first-time users
curl -X POST http://localhost:3000/api/v1/login \
  -H "Authorization: Bearer <jwt-token>"

# Expected Response (404):
# {
#   "error": "User not found",
#   "message": "First time login",
#   "firebaseUid": "firebase-uid-123"
# }
```

#### 2. Create Profile (First-Time Only)
```bash
# Create profile with the JWT token (contains only uid, no userId yet)
curl -X POST http://localhost:3000/api/v1/profiles \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "birthday": "01/15",
    "email": "john@example.com",
    "phoneNumber": "+1234567890"
  }'

# Response includes the profile with id and firebaseUid
# Server has set custom claims on Firebase user with userId
```

#### 3. Refresh Token to Get Custom Claims
```bash
# Login again to get refreshed token with userId custom claim
npm run firebase-login john@example.com password123

# The decoded token should now show:
# {
#   "uid": "firebase-user-id",
#   "userId": "507f1f77bcf86cd799439011",  ← Custom claim added!
#   "email": "john@example.com",
#   ...
# }

# Verify login now succeeds with profile data
curl -X POST http://localhost:3000/api/v1/login \
  -H "Authorization: Bearer <refreshed-jwt-token>"

# Expected Response (200):
# {
#   "message": "Login success",
#   "profile": { ... }
# }
```

#### 4. Test Protected Endpoints
```bash
# Get your profile (userId in JWT must match profile id in URL)
curl http://localhost:3000/api/v1/profiles/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <refreshed-jwt-token>"

# Create a budget
curl -X POST http://localhost:3000/api/v1/users/507f1f77bcf86cd799439011/budgets \
  -H "Authorization: Bearer <refreshed-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "month": "January",
    "year": 2025,
    "amount": 5000,
    "remaining": 5000
  }'

# Try accessing another user's resources (should fail with 401)
curl http://localhost:3000/api/v1/users/different-user-id/budgets \
  -H "Authorization: Bearer <refreshed-jwt-token>"

# Response: {"error": "Unauthorized access"}
```

### Testing with Swagger UI

1. Navigate to `http://localhost:3000/docs`
2. Click "Authorize" button at the top
3. Enter your JWT token in the format: `Bearer <your-jwt-token>`
4. Test endpoints interactively with automatic token injection

### Common Testing Scenarios

**Scenario 1: Missing Token**
```bash
curl http://localhost:3000/api/v1/profiles
# Response: 401 {"error": "No token provided"}
```

**Scenario 2: Invalid Token**
```bash
curl http://localhost:3000/api/v1/profiles \
  -H "Authorization: Bearer invalid-token"
# Response: 401 {"error": "Invalid token"}
```

**Scenario 3: Expired Token**
```bash
# Use token older than 1 hour
curl http://localhost:3000/api/v1/profiles \
  -H "Authorization: Bearer <expired-token>"
# Response: 401 {"error": "Token expired"}
```

**Scenario 4: User Not Fully Registered**
```bash
# Try to access protected resource before profile creation
curl http://localhost:3000/api/v1/users/123/budgets \
  -H "Authorization: Bearer <jwt-without-userId-claim>"
# Response: 401 {"error": "User not fully registered", "message": "Please complete profile creation..."}
```

**Scenario 5: Unauthorized Access (userId Mismatch)**
```bash
# JWT userId = "user-123", but trying to access "user-456" resources
curl http://localhost:3000/api/v1/users/user-456/budgets \
  -H "Authorization: Bearer <jwt-with-userId-123>"
# Response: 401 {"error": "Unauthorized access"}
```

## React Native Client Implementation Guide

This section provides implementation guidance for the React Native mobile app (located in `/client`).

### Prerequisites

Install Firebase SDK in your React Native project:

```bash
cd client
npm install firebase
# or
yarn add firebase
```

### Firebase Configuration

Create a Firebase configuration file:

**File: `client/src/config/firebase.ts`**

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
```

### Authentication Flows

#### 1. Sign-Up Flow

**Screen: `client/src/screens/SignUpScreen.tsx`**

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Step 2: Get JWT token
      const token = await userCredential.user.getIdToken();

      // Step 3: Check if profile exists (should be 404 for new users)
      const loginResponse = await fetch('http://localhost:3000/api/v1/login', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (loginResponse.status === 404) {
        // First time user - navigate to profile creation
        const data = await loginResponse.json();
        navigation.navigate('CreateProfile', {
          firebaseUid: data.firebaseUid,
          email: email
        });
      } else if (loginResponse.status === 200) {
        // Profile already exists (unlikely for sign-up, but handle it)
        const { profile } = await loginResponse.json();
        navigation.replace('Home', { profile });
      } else {
        // Unexpected error
        Alert.alert('Error', 'Failed to check registration status');
      }

    } catch (error: any) {
      console.error('Sign-up error:', error);

      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'Email is already registered. Please login instead.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Invalid email format');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Error', 'Password is too weak');
      } else {
        Alert.alert('Error', 'Sign-up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? "Signing up..." : "Sign Up"}
        onPress={handleSignUp}
        disabled={loading}
      />
      <Button
        title="Already have an account? Login"
        onPress={() => navigation.navigate('Login')}
      />
    </View>
  );
};
```

#### 2. Profile Creation Flow

**Screen: `client/src/screens/CreateProfileScreen.tsx`**

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { auth } from '../config/firebase';

export const CreateProfileScreen = ({ route, navigation }) => {
  const { firebaseUid, email } = route.params;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState(''); // Format: MM/DD
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateProfile = async () => {
    // Validate inputs
    if (!firstName || !lastName || !birthday || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate birthday format (MM/DD)
    const birthdayRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/;
    if (!birthdayRegex.test(birthday)) {
      Alert.alert('Error', 'Birthday must be in MM/DD format (e.g., 01/15)');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Get current JWT token
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        Alert.alert('Error', 'Authentication error. Please sign up again.');
        navigation.replace('SignUp');
        return;
      }

      // Step 2: Create profile
      const response = await fetch('http://localhost:3000/api/v1/profiles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName,
          lastName,
          birthday,
          email,
          phoneNumber
        })
      });

      if (response.status === 201) {
        // Profile created successfully

        // Step 3: Refresh token to get userId custom claim
        const newToken = await auth.currentUser?.getIdToken(true);

        // Step 4: Verify login (optional but recommended)
        const loginResponse = await fetch('http://localhost:3000/api/v1/login', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${newToken}`
          }
        });

        if (loginResponse.status === 200) {
          const { profile } = await loginResponse.json();
          navigation.replace('Home', { profile });
        } else {
          // Profile created but login check failed - still navigate to home
          const profile = await response.json();
          navigation.replace('Home', { profile });
        }

      } else if (response.status === 409) {
        // Email already exists
        Alert.alert('Error', 'Email is already registered');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to create profile');
      }

    } catch (error) {
      console.error('Profile creation error:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        placeholder="Birthday (MM/DD)"
        value={birthday}
        onChangeText={setBirthday}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      <Button
        title={loading ? "Creating Profile..." : "Create Profile"}
        onPress={handleCreateProfile}
        disabled={loading}
      />
    </View>
  );
};
```

#### 3. Login Flow

**Screen: `client/src/screens/LoginScreen.tsx`**

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Firebase authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Step 2: Get JWT token
      const token = await userCredential.user.getIdToken();

      // Step 3: Check registration status
      const response = await fetch('http://localhost:3000/api/v1/login', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        // User has profile - navigate to app
        const { profile } = await response.json();
        navigation.replace('Home', { profile });

      } else if (response.status === 404) {
        // User exists in Firebase but no profile - navigate to profile creation
        const { firebaseUid } = await response.json();
        navigation.navigate('CreateProfile', {
          firebaseUid,
          email
        });

      } else if (response.status === 401) {
        const { error } = await response.json();

        if (error === 'Token expired') {
          // Refresh token and retry
          const newToken = await auth.currentUser?.getIdToken(true);
          // Retry login check...
          Alert.alert('Info', 'Token refreshed. Please try again.');
        } else {
          Alert.alert('Error', 'Authentication failed');
        }
      } else {
        Alert.alert('Error', 'Login failed. Please try again.');
      }

    } catch (error: any) {
      console.error('Login error:', error);

      if (error.code === 'auth/invalid-credential') {
        Alert.alert('Error', 'Invalid email or password');
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'No account found with this email');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Error', 'Too many failed attempts. Please try again later.');
      } else {
        Alert.alert('Error', 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? "Logging in..." : "Login"}
        onPress={handleLogin}
        disabled={loading}
      />
      <Button
        title="Don't have an account? Sign Up"
        onPress={() => navigation.navigate('SignUp')}
      />
    </View>
  );
};
```

#### 4. API Service Helper

Create a helper module for API calls:

**File: `client/src/services/api.ts`**

```typescript
import { auth } from '../config/firebase';

const API_BASE_URL = 'http://localhost:3000/api/v1';

/**
 * Makes an authenticated API request
 */
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get current JWT token
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  // Make request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle token expiration
  if (response.status === 401) {
    const data = await response.json();
    if (data.error === 'Token expired') {
      // Refresh token and retry once
      const newToken = await auth.currentUser?.getIdToken(true);
      headers['Authorization'] = `Bearer ${newToken}`;

      return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    }
  }

  return response;
}

/**
 * Check login status
 */
export async function checkLoginStatus() {
  const response = await authenticatedFetch('/login', {
    method: 'POST'
  });
  return response;
}

/**
 * Create user profile
 */
export async function createProfile(profileData: {
  firstName: string;
  lastName: string;
  birthday: string;
  email: string;
  phoneNumber: string;
}) {
  const response = await authenticatedFetch('/profiles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });
  return response;
}

/**
 * Get user profile
 */
export async function getProfile(userId: string) {
  const response = await authenticatedFetch(`/profiles/${userId}`);
  return response;
}

/**
 * Get user budgets
 */
export async function getBudgets(userId: string) {
  const response = await authenticatedFetch(`/users/${userId}/budgets`);
  return response;
}

// Add more API functions as needed...
```

### Usage in Components

With the API service helper, your components become cleaner:

```typescript
import { checkLoginStatus, createProfile } from '../services/api';

// In your component
const handleLogin = async () => {
  const response = await checkLoginStatus();
  if (response.status === 200) {
    const { profile } = await response.json();
    // Navigate to home...
  }
};
```

### Key Points

1. **Two-Step Sign-Up**: Firebase auth first, then profile creation
2. **Login Check**: Always call `/login` endpoint after Firebase authentication
3. **Token Refresh**: Use `getIdToken(true)` after profile creation to get userId claim
4. **Error Handling**: Handle all response codes (200, 404, 401) appropriately
5. **Token Expiration**: Auto-retry with refreshed token on 401 "Token expired"

### Navigation Flow

```
App Start
  ↓
Check Auth State
  ├─ Not Authenticated → Login/SignUp Screen
  └─ Authenticated → Call /login endpoint
      ├─ 200 → Home Screen (user has profile)
      └─ 404 → CreateProfile Screen (first-time user)
```

### Environment Variables

Consider using environment variables for the API URL:

```typescript
// client/src/config/constants.ts
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api/v1'
  : 'https://your-production-api.com/api/v1';
```

## Development Guidelines

1. **Adding New Features**:
   - Create Zod schema and TypeScript types in `src/models/`
   - Implement repository in `src/repositories/`
   - Add business logic in `src/services/`
   - Create REST endpoints with Zod validation in `src/routes/`
   - Protect endpoints with `authenticateToken` and `requireSameUser()` middleware

2. **Schema Validation**:
   - Define Zod schemas in model files
   - Use `.safeParse()` for validation in routes
   - Infer TypeScript types from Zod schemas with `z.infer<>`
   - Return clear validation error messages to clients

3. **Database Operations**:
   - All database operations go through repositories
   - Use services for business logic and validation
   - Routes should only handle HTTP concerns

4. **Error Handling**:
   - Repositories throw database-specific errors
   - Services throw business logic errors
   - Routes format errors for HTTP responses
   - Zod validation errors return 400 status with detailed error messages
   - Authentication/authorization errors return 401 status

5. **Authentication & Authorization**:
   - Always use `authenticateToken` middleware on protected routes
   - Use `requireSameUser(paramName)` to enforce resource-level authorization
   - Extract firebaseUid from `req.user.uid` (set by authenticateToken)
   - Never trust userId from request body - always use JWT claims
   - Return 401 for all authentication failures (no 403)
   - Set custom claims via Firebase Admin SDK after user creation

6. **Security Best Practices**:
   - Never commit `.env` file or Firebase service account JSON
   - Always validate JWT tokens on the server side
   - Use Firebase Admin SDK for token verification (not client SDK)
   - Implement @SameUser pattern for all user-specific resources
   - Log authentication failures for security monitoring
