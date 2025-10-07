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
│   └── Receipt.ts            # Receipt model with Zod schema
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
│   └── ReceiptService.ts     # Business logic for receipts
├── routes/
│   ├── profile.routes.ts     # Profile REST endpoints
│   ├── budget.routes.ts      # Budget REST endpoints
│   ├── categories.routes.ts  # Category REST endpoints (with Zod validation)
│   ├── transaction.routes.ts # Transaction REST endpoints
│   └── receipt.routes.ts     # Receipt REST endpoints
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
