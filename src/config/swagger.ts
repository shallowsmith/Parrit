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