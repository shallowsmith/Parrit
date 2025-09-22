# Parrit

Voice Activated Finance Tracker

## Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/shallowsmith/Parrit.git
cd Parrit
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode
Run with hot reload:
```bash
npm run dev
```

### Production Mode
1. Build the application:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

The server will start on `http://localhost:3000`

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
