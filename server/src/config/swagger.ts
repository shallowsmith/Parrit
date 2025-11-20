import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Parrit API',
      version: '1.0.0',
      description: `Voice Activated Finance Tracker API

## Authentication

This API uses Firebase JWT tokens for authentication and authorization.

### Getting a Token

1. **Sign up/Login with Firebase** using email and password
2. **Create a profile** using POST /api/v1/profiles with your JWT token
3. **Refresh your token** to get the updated token with userId custom claim
4. **Use the token** for all subsequent API requests

### Using the Token

Add the JWT token to the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

### Authorization Rules

- Most endpoints require the \`userId\` custom claim in the JWT
- The \`userId\` in the JWT must match the \`userId\` or \`id\` in the URL path
- Profile creation is the exception - it only requires authentication (firebaseUid)

### Testing with Swagger UI

1. Click the "Authorize" button (🔒) at the top right
2. Enter your JWT token in the format: \`Bearer <token>\`
3. Click "Authorize"
4. Test your endpoints!
      `,
      contact: {
        name: 'Parrit Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    security: [
      {
        BearerAuth: []
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase JWT token. Obtain by authenticating with Firebase. Use format: Bearer <token>'
        }
      },
      schemas: {
        Profile: {
          type: 'object',
          required: ['firstName', 'lastName', 'birthday', 'email', 'phoneNumber'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the profile',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            firebaseUid: {
              type: 'string',
              description: 'Firebase user ID from authentication',
              example: 'abc123xyz789firebaseuid',
            },
            firstName: {
              type: 'string',
              description: 'First name of the user',
              example: 'John',
            },
            lastName: {
              type: 'string',
              description: 'Last name of the user',
              example: 'Doe',
            },
            birthday: {
              type: 'string',
              pattern: '^[0-9]{2}/[0-9]{2}$',
              description: 'Birthday in MM/DD format',
              example: '01/15',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the user',
              example: 'john.doe@example.com',
            },
            phoneNumber: {
              type: 'string',
              description: 'Phone number of the user',
              example: '+1234567890',
            },
            profileImage: {
              type: 'string',
              nullable: true,
              description: 'URL to profile image',
              example: 'https://example.com/image.jpg',
            },
            nickname: {
              type: 'string',
              nullable: true,
              description: 'User nickname',
              example: 'Johnny',
            },
            status: {
              type: 'string',
              nullable: true,
              description: 'User status',
              example: 'Active',
            },
          },
        },
        Budget: {
          type: 'object',
          required: ['userId', 'month', 'year', 'amount', 'remaining'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the budget',
              example: '123e4567-e89b-12d3-a456-426614174001',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user this budget belongs to',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            month: {
              type: 'string',
              description: 'Month for the budget',
              example: 'January',
            },
            year: {
              type: 'string',
              description: 'Year for the budget',
              example: '2024',
            },
            amount: {
              type: 'number',
              description: 'Total budget amount',
              example: 1000.00,
            },
            remaining: {
              type: 'number',
              description: 'Remaining budget amount',
              example: 750.00,
            },
          },
        },
        Category: {
          type: 'object',
          required: ['id', 'name', 'type', 'userId'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the category',
              example: '123e4567-e89b-12d3-a456-426614174002',
            },
            name: {
              type: 'string',
              description: 'Name of the category',
              example: 'Groceries',
            },
            type: {
              type: 'string',
              description: 'Type of category',
              example: 'Expense',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user this category belongs to',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
          },
        },
        Transaction: {
          type: 'object',
          required: ['id', 'userId', 'vendorName', 'description', 'dateTime', 'amount', 'paymentType', 'categoryId'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the transaction',
              example: '123e4567-e89b-12d3-a456-426614174003',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user this transaction belongs to',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            vendorName: {
              type: 'string',
              description: 'Name of the vendor/merchant',
              example: 'Starbucks',
            },
            description: {
              type: 'string',
              description: 'Description of the transaction',
              example: 'coffee',
            },
            dateTime: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time of the transaction',
              example: '2024-01-15T10:30:00Z',
            },
            amount: {
              type: 'number',
              description: 'Transaction amount',
              example: 5.99,
            },
            paymentType: {
              type: 'string',
              description: 'Type of payment used',
              example: 'Credit Card',
            },
            categoryId: {
              type: 'string',
              description: 'Category ID for the transaction (MongoDB ObjectId)',
              example: '507f1f77bcf86cd799439012',
            },
            receiptId: {
              type: 'string',
              nullable: true,
              description: 'Optional receipt ID linked to this transaction (MongoDB ObjectId)',
              example: '507f1f77bcf86cd799439013',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Timestamp when the transaction was created',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Timestamp when the transaction was last updated',
            },
          },
        },
        Receipt: {
          type: 'object',
          required: ['id', 'userId', 'vendorName', 'description', 'dateTime', 'amount', 'paymentType', 'categoryName', 'receiptImageUrl'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the receipt',
              example: '123e4567-e89b-12d3-a456-426614174004',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user this receipt belongs to',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            vendorName: {
              type: 'string',
              description: 'Name of the vendor/merchant',
              example: 'Starbucks',
            },
            description: {
              type: 'string',
              description: 'Description of the purchase',
              example: 'coffee',
            },
            dateTime: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time of the purchase',
              example: '2024-01-15T10:30:00Z',
            },
            amount: {
              type: 'number',
              description: 'Purchase amount',
              example: 5.99,
            },
            paymentType: {
              type: 'string',
              description: 'Type of payment used',
              example: 'Credit Card',
            },
            categoryName: {
              type: 'string',
              description: 'Category name for the purchase',
              example: 'Food & Dining',
            },
            receiptImageUrl: {
              type: 'string',
              description: 'URL to receipt image',
              example: 'https://example.com/receipt/starbucks-12345.jpg',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Resource not found',
            },
            missing: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'List of missing required fields',
              example: ['firstName', 'email'],
            },
          },
        },
        UnauthorizedError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Unauthorized access',
            },
            message: {
              type: 'string',
              description: 'Additional context about the authorization failure',
              example: 'Please complete profile creation to access this resource',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJSDoc(options);
export default specs;