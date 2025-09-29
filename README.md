# Parrit

Voice Activated Finance Tracker

## Architecture Overview

This application follows a **Three-Layer Architecture** pattern for better separation of concerns, maintainability, and testability:

### 🏗️ Three-Layer Architecture

1. **Presentation Layer (Routes)** - `src/routes/`
   - Handles HTTP requests and responses
   - Input validation and sanitization
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
- `GET /users/:userId/categories` - Get categories for a user

Category fields:
- id
- name
- type
- userId

### Transactions
- `GET /users/:userId/transactions` - Get transactions for a user

Transaction fields:
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
- `GET /users/:userId/receipts` - Get receipts for a user

Receipt fields:
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
│   ├── database.ts      # MongoDB connection singleton
│   └── swagger.ts       # Swagger/OpenAPI configuration
├── models/
│   └── Profile.ts       # TypeScript interfaces and validation
├── repositories/
│   └── ProfileRepository.ts  # Data access layer for profiles
├── services/
│   └── ProfileService.ts     # Business logic for profiles
├── routes/
│   ├── profile.routes.ts     # Profile REST endpoints
│   ├── budget.routes.ts      # Budget endpoints (in-memory)
│   ├── categories.routes.ts  # Category endpoints (in-memory)
│   ├── transaction.routes.ts # Transaction endpoints (in-memory)
│   └── receipt.routes.ts     # Receipt endpoints (in-memory)
└── index.ts             # Application entry point
```

### Key Design Patterns

- **Singleton Pattern**: Database connection management
- **Repository Pattern**: Abstract database operations
- **Service Layer Pattern**: Business logic encapsulation
- **Dependency Injection**: Services injected into routes
- **Lazy Initialization**: Database collections initialized on first use

## Development Guidelines

1. **Adding New Features**:
   - Create model interfaces in `src/models/`
   - Implement repository in `src/repositories/`
   - Add business logic in `src/services/`
   - Create REST endpoints in `src/routes/`

2. **Database Operations**:
   - All database operations go through repositories
   - Use services for business logic and validation
   - Routes should only handle HTTP concerns

3. **Error Handling**:
   - Repositories throw database-specific errors
   - Services throw business logic errors
   - Routes format errors for HTTP responses
