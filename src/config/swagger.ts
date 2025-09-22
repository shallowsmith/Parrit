import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Parrit API',
      version: '1.0.0',
      description: 'Voice Activated Finance Tracker API',
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
    components: {
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
          required: ['id', 'userId', 'vendorName', 'description', 'dateTime', 'amount', 'paymentType', 'categoryName'],
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
            categoryName: {
              type: 'string',
              description: 'Category name for the transaction',
              example: 'Food & Dining',
            },
            receiptImageUrl: {
              type: 'string',
              nullable: true,
              description: 'URL to receipt image',
              example: 'https://example.com/receipt/starbucks-12345.jpg',
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
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJSDoc(options);
export default specs;