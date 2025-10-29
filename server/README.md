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

### Profiles
- `GET /profiles` - Get all profiles
- `GET /profiles/:id` - Get profile by ID
- `POST /profiles` - Create new profile

Required fields for creating a profile:
- firstName
- lastName
- birthday (format: mm/dd)
- email
- phoneNumber

### Budgets
- `GET /users/:userId/budgets` - Get all budgets for a user
- `GET /users/:userId/budgets/:budgetId` - Get specific budget by ID
- `POST /users/:userId/budgets` - Create new budget for a user

Required fields for creating a budget:
- month
- year
- amount
- remaining

### Categories
- `GET /users/:userId/categories` - Get all categories for a user
- `GET /users/:userId/categories/:categoryId` - Get specific category by ID
- `POST /users/:userId/categories` - Create new category for a user
- `PUT /users/:userId/categories/:categoryId` - Update an existing category
- `DELETE /users/:userId/categories/:categoryId` - Delete a category

Required fields for creating a category:
- name
- type

Category fields (validated with Zod):
- id
- name
- type
- userId

### Transactions
- `GET /users/:userId/transactions` - Get all transactions for a user
- `GET /users/:userId/transactions/:transactionId` - Get specific transaction by ID
- `POST /users/:userId/transactions` - Create new transaction for a user
- `PUT /users/:userId/transactions/:transactionId` - Update an existing transaction
- `DELETE /users/:userId/transactions/:transactionId` - Delete a transaction

Required fields for creating a transaction:
- vendorName
- description
- dateTime
- amount
- paymentType
- categoryName

Transaction fields (validated with Zod):
- id
- userId
- vendorName
- description
- dateTime
- amount
- paymentType
- categoryName
- receiptImageUrl (optional)

### Receipts
- `GET /users/:userId/receipts` - Get all receipts for a user
- `GET /users/:userId/receipts/:receiptId` - Get specific receipt by ID
- `POST /users/:userId/receipts` - Create new receipt for a user
- `PUT /users/:userId/receipts/:receiptId` - Update an existing receipt
- `DELETE /users/:userId/receipts/:receiptId` - Delete a receipt

Required fields for creating a receipt:
- vendorName
- description
- dateTime
- amount
- paymentType
- categoryName
- receiptImageUrl

Receipt fields (validated with Zod):
- id
- userId
- vendorName
- description
- dateTime
- amount
- paymentType
- categoryName
- receiptImageUrl

### Spending History
- `GET /users/:userId/spending/summary` - Get aggregated spending summary by category
- `GET /users/:userId/spending/detailed` - Get detailed spending report with all transactions grouped by category
- `GET /users/:userId/spending/monthly-trends` - Get monthly spending trends with percentage comparison

**Summary Endpoint** - Returns aggregated spending totals per category with percentages for visualization (e.g., pie charts, donut charts):

Query Parameters:
- `period` (required): Time period for analysis
  - `current_month` - From first day of current month to now
  - `past_week` - Last 7 days from now
  - `past_30_days` - Last 30 days from now
  - `custom` - Custom date range (requires startDate and endDate)
- `startDate` (required if period=custom): ISO 8601 datetime string (e.g., "2025-10-01T00:00:00Z")
- `endDate` (required if period=custom): ISO 8601 datetime string (e.g., "2025-10-29T23:59:59Z")

Response includes:
- `userId` - User ID
- `period` - Period label (e.g., "Current Month", "Past Week")
- `startDate` - Actual start date used for the query
- `endDate` - Actual end date used for the query
- `totalSpending` - Total amount spent across all categories
- `categories` - Array of category summaries:
  - `categoryId` - Category ID
  - `categoryName` - Category name
  - `categoryType` - Category type (e.g., "expense", "income")
  - `totalAmount` - Total spending in this category
  - `transactionCount` - Number of transactions in this category
  - `percentage` - Percentage of total spending (rounded to 2 decimals)

**Detailed Endpoint** - Returns all transactions grouped by category for export or detailed analysis:

Query Parameters: Same as summary endpoint (period, startDate, endDate)

Response includes:
- Same top-level fields as summary endpoint (userId, period, startDate, endDate, totalSpending)
- `categories` - Array of category details with transactions:
  - `categoryId`, `categoryName`, `categoryType` - Category information
  - `totalAmount` - Total spending in this category
  - `transactionCount` - Number of transactions in this category
  - `transactions` - Array of transaction details:
    - `id` - Transaction ID
    - `vendorName` - Merchant name
    - `description` - Transaction description
    - `dateTime` - Transaction date and time
    - `amount` - Transaction amount
    - `paymentType` - Payment method used
    - `receiptId` - Optional receipt reference

**Monthly Trends Endpoint** - Returns current month spending with historical monthly breakdown and percentage change comparison:

Query Parameters:
- `monthCount` (optional, default: 6): Number of previous months to analyze (min: 1, max: 24)
- `includeCurrentMonth` (optional, default: true): Whether to include current month in response

Response includes:
- `userId` - User ID
- `currentMonth` - Current month summary:
  - `month` - Month label (e.g., "October 2025")
  - `totalAmount` - Total spending this month
  - `transactionCount` - Number of transactions this month
  - `startDate` - Start of current month
  - `endDate` - End date (now if incomplete month)
- `trend` - Comparison data:
  - `percentageChange` - Percentage change vs average of previous months (e.g., 12 for +12%)
  - `direction` - "increase", "decrease", or "stable"
  - `comparisonPeriod` - Description (e.g., "last 6 months")
  - `previousMonthsAverage` - Average spending of previous months
- `monthlyBreakdown` - Array of previous months data (oldest to newest):
  - `month` - Month label
  - `year` - Year number
  - `monthNumber` - Month number (1-12)
  - `totalAmount` - Total spending for that month
  - `transactionCount` - Number of transactions
  - `startDate` - First day of month
  - `endDate` - Last day of month

**Use Cases**:
- **Summary endpoint**: Display pie charts, donut charts, or category breakdowns showing spending distribution
- **Detailed endpoint**: Export spending reports, show detailed transaction lists grouped by category, generate CSV/PDF reports
- **Monthly trends endpoint**: Display line charts showing spending over time, show percentage trend indicators, compare current vs historical spending

### Spending History API Examples

**Example 1: Get current month spending summary**
```bash
curl -X GET "http://localhost:3000/api/v1/users/67211f56abc123def4567890/spending/summary?period=current_month" \
  -H "Authorization: Bearer <your-jwt-token>"
```

Response:
```json
{
  "userId": "67211f56abc123def4567890",
  "period": "Current Month",
  "startDate": "2025-10-01T00:00:00.000Z",
  "endDate": "2025-10-29T23:59:59.999Z",
  "totalSpending": 856.42,
  "categories": [
    {
      "categoryId": "507f1f77bcf86cd799439012",
      "categoryName": "Food",
      "categoryType": "expense",
      "totalAmount": 129.97,
      "transactionCount": 8,
      "percentage": 15.18
    },
    {
      "categoryId": "507f1f77bcf86cd799439013",
      "categoryName": "Transportation",
      "categoryType": "expense",
      "totalAmount": 245.50,
      "transactionCount": 12,
      "percentage": 28.67
    }
  ]
}
```

**Example 2: Get past week spending summary**
```bash
curl -X GET "http://localhost:3000/api/v1/users/67211f56abc123def4567890/spending/summary?period=past_week" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Example 3: Get detailed report for custom date range**
```bash
curl -X GET "http://localhost:3000/api/v1/users/67211f56abc123def4567890/spending/detailed?period=custom&startDate=2025-09-01T00:00:00Z&endDate=2025-09-30T23:59:59Z" \
  -H "Authorization: Bearer <your-jwt-token>"
```

Response:
```json
{
  "userId": "67211f56abc123def4567890",
  "period": "Custom Range",
  "startDate": "2025-09-01T00:00:00.000Z",
  "endDate": "2025-09-30T23:59:59.999Z",
  "totalSpending": 1245.67,
  "categories": [
    {
      "categoryId": "507f1f77bcf86cd799439012",
      "categoryName": "Food",
      "categoryType": "expense",
      "totalAmount": 385.20,
      "transactionCount": 15,
      "transactions": [
        {
          "id": "507f1f77bcf86cd799439020",
          "vendorName": "Starbucks",
          "description": "Morning coffee",
          "dateTime": "2025-09-05T08:30:00.000Z",
          "amount": 5.99,
          "paymentType": "Credit Card",
          "receiptId": "507f1f77bcf86cd799439025"
        },
        {
          "id": "507f1f77bcf86cd799439021",
          "vendorName": "Chipotle",
          "description": "Lunch",
          "dateTime": "2025-09-05T12:15:00.000Z",
          "amount": 12.50,
          "paymentType": "Debit Card"
        }
      ]
    }
  ]
}
```

**Example 4: Get monthly spending trends (default 6 months)**
```bash
curl -X GET "http://localhost:3000/api/v1/users/67211f56abc123def4567890/spending/monthly-trends" \
  -H "Authorization: Bearer <your-jwt-token>"
```

Response:
```json
{
  "userId": "67211f56abc123def4567890",
  "currentMonth": {
    "month": "October 2025",
    "totalAmount": 2345,
    "transactionCount": 45,
    "startDate": "2025-10-01T00:00:00.000Z",
    "endDate": "2025-10-29T23:59:59.999Z"
  },
  "trend": {
    "percentageChange": 12,
    "direction": "increase",
    "comparisonPeriod": "last 6 months",
    "previousMonthsAverage": 2094.64
  },
  "monthlyBreakdown": [
    {
      "month": "April 2025",
      "year": 2025,
      "monthNumber": 4,
      "totalAmount": 2300,
      "transactionCount": 55,
      "startDate": "2025-04-01T00:00:00.000Z",
      "endDate": "2025-04-30T23:59:59.999Z"
    },
    {
      "month": "May 2025",
      "year": 2025,
      "monthNumber": 5,
      "totalAmount": 1950,
      "transactionCount": 48,
      "startDate": "2025-05-01T00:00:00.000Z",
      "endDate": "2025-05-31T23:59:59.999Z"
    },
    {
      "month": "June 2025",
      "year": 2025,
      "monthNumber": 6,
      "totalAmount": 2100,
      "transactionCount": 52,
      "startDate": "2025-06-01T00:00:00.000Z",
      "endDate": "2025-06-30T23:59:59.999Z"
    }
  ]
}
```

**Example 5: Get monthly trends for last 12 months**
```bash
curl -X GET "http://localhost:3000/api/v1/users/67211f56abc123def4567890/spending/monthly-trends?monthCount=12" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Example 6: Using with Swagger UI**
1. Navigate to `http://localhost:3000/docs`
2. Click "Authorize" and enter your JWT token
3. Find the "Spending History" section
4. Try the `/users/{userId}/spending/summary` endpoint
5. Fill in:
   - `userId`: Your user ID
   - `period`: Select from dropdown (e.g., "current_month")
6. Click "Execute" to see the results

**Frontend Integration Example (React/React Native)**
```typescript
// Fetch spending summary for pie chart visualization
async function fetchSpendingSummary(userId: string, period: string) {
  const response = await fetch(
    `http://localhost:3000/api/v1/users/${userId}/spending/summary?period=${period}`,
    {
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
      },
    }
  );

  const data = await response.json();

  // Use data.categories for pie chart
  // Each category has: name, totalAmount, percentage
  return data;
}

// Fetch detailed report for export
async function exportSpendingReport(userId: string, startDate: string, endDate: string) {
  const response = await fetch(
    `http://localhost:3000/api/v1/users/${userId}/spending/detailed?period=custom&startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
      },
    }
  );

  const data = await response.json();

  // Process data.categories to generate CSV/PDF
  // Each category has transactions array with full details
  return data;
}

// Fetch monthly trends for line chart visualization
async function fetchMonthlyTrends(userId: string, monthCount: number = 6) {
  const response = await fetch(
    `http://localhost:3000/api/v1/users/${userId}/spending/monthly-trends?monthCount=${monthCount}`,
    {
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
      },
    }
  );

  const data = await response.json();

  // Use data.currentMonth for main display ($2,345)
  // Use data.trend.percentageChange for trend indicator (+12%)
  // Use data.monthlyBreakdown for line chart data points
  // Example: data.monthlyBreakdown.map(m => ({ x: m.month, y: m.totalAmount }))
  return data;
}
```

## Project Structure

```
src/
├── config/
│   ├── database.ts           # MongoDB connection singleton
│   └── swagger.ts            # Swagger/OpenAPI configuration
├── models/
│   ├── Profile.ts            # Profile model with Zod schema
│   ├── Budget.ts             # Budget model with Zod schema
│   ├── Category.ts           # Category model with Zod schema
│   ├── Transaction.ts        # Transaction model with Zod schema
│   ├── Receipt.ts            # Receipt model with Zod schema
│   └── SpendingHistory.ts    # Spending history models with Zod schemas
├── repositories/
│   ├── ProfileRepository.ts  # Data access layer for profiles
│   ├── BudgetRepository.ts   # Data access layer for budgets
│   ├── CategoryRepository.ts # Data access layer for categories
│   ├── TransactionRepository.ts # Data access layer for transactions
│   └── ReceiptRepository.ts  # Data access layer for receipts
├── services/
│   ├── ProfileService.ts     # Business logic for profiles
│   ├── BudgetService.ts      # Business logic for budgets
│   ├── CategoryService.ts    # Business logic for categories
│   ├── TransactionService.ts # Business logic for transactions
│   ├── ReceiptService.ts     # Business logic for receipts
│   └── SpendingHistoryService.ts # Business logic for spending analytics
├── routes/
│   ├── profile.routes.ts     # Profile REST endpoints
│   ├── budget.routes.ts      # Budget REST endpoints
│   ├── categories.routes.ts  # Category REST endpoints (with Zod validation)
│   ├── transaction.routes.ts # Transaction REST endpoints
│   ├── receipt.routes.ts     # Receipt REST endpoints
│   └── spendingHistory.routes.ts # Spending history REST endpoints
└── index.ts                  # Application entry point
```

### Key Design Patterns

- **Singleton Pattern**: Database connection management
- **Repository Pattern**: Abstract database operations
- **Service Layer Pattern**: Business logic encapsulation
- **Dependency Injection**: Services injected into routes
- **Lazy Initialization**: Database collections initialized on first use
- **Schema Validation**: Zod schemas for runtime type validation and TypeScript type inference

## Development Guidelines

1. **Adding New Features**:
   - Create Zod schema and TypeScript types in `src/models/`
   - Implement repository in `src/repositories/`
   - Add business logic in `src/services/`
   - Create REST endpoints with Zod validation in `src/routes/`

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
