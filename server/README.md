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

## Docker Deployment

### Quick Start with Docker Compose

The easiest way to run Parrit with Docker is using Docker Compose, which includes both the application and MongoDB:

1. **Set up environment variables**:
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Firebase service account credentials
nano .env
```

2. **Start the application**:
```bash
docker-compose up -d
```

This will:
- Start MongoDB on port 27017
- Build and start the Parrit server on port 3000
- Create a persistent volume for MongoDB data
- Set up networking between containers

3. **View logs**:
```bash
# View all logs
docker-compose logs -f

# View server logs only
docker-compose logs -f parrit-server
```

4. **Stop the application**:
```bash
docker-compose down

# To also remove volumes (data)
docker-compose down -v
```

### Building and Running with Docker (Without Compose)

If you prefer to use Docker commands directly:

1. **Build the Docker image**:
```bash
docker build -t parrit-server .
```

2. **Run the container**:
```bash
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority" \
  -e DATABASE_NAME="parrit" \
  -e FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project",...}' \
  --name parrit \
  parrit-server
```

**Note**: When using this method, you need to provide your own MongoDB instance (Atlas or separate container).

3. **View logs**:
```bash
docker logs -f parrit
```

4. **Stop and remove container**:
```bash
docker stop parrit
docker rm parrit
```

### Docker Configuration Files

- **Dockerfile** - Multi-stage build for optimized production image
- **docker-compose.yml** - Complete stack with MongoDB
- **.dockerignore** - Excludes unnecessary files from build
- **.env.example** - Template for environment variables

### Environment Variables for Docker

Required environment variables (set in `.env` file or pass via `-e` flag):

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://mongodb:27017` (Docker Compose)<br/>`mongodb+srv://user:pass@cluster.mongodb.net/` (Atlas) |
| `DATABASE_NAME` | Database name | `parrit` |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON (single-line) | `{"type":"service_account",...}` |
| `NODE_ENV` | Node environment | `production` |

### Health Check

The Docker image includes a health check that pings the `/docs` endpoint every 30 seconds:

```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' parrit
```

### Docker Image Details

- **Base Image**: Node.js 20 Alpine (lightweight and secure)
- **Architecture**: Multi-stage build
  - Stage 1: Build TypeScript application
  - Stage 2: Production runtime (only compiled code and production dependencies)
- **Security**: Runs as non-root user (`nodejs`)
- **Size**: Optimized for small image size (~150MB)
- **Port**: Exposes port 3000

### Accessing the Application

Once running, access:
- **API**: http://localhost:3000/api/v1
- **Swagger Documentation**: http://localhost:3000/docs

## Cloud Deployment (Control Plane)

### Production Environment

The Parrit API is deployed on Control Plane and accessible at:

- **Production API**: https://parrit-api-c0m4x6xhjvppr.gcp-us-central1.controlplane.us/api/v1
- **Swagger Documentation**: https://parrit-api-c0m4x6xhjvppr.gcp-us-central1.controlplane.us/docs/

### What is Control Plane?

Control Plane (controlplane.com) is a virtual cloud platform that abstracts infrastructure across GCP, AWS, and Azure under a unified API. It provides:
- **Universal Cloud API**: Single interface to manage resources across multiple cloud providers
- **Container-native Platform**: Built for Kubernetes and containerized workloads
- **Built-in Image Registry**: Managed container registry for Docker images
- **Auto-scaling Workloads**: Managed applications with health checks and zero-downtime deployments
- **Multi-tenant Architecture**: Organizations → GVCs (Global Virtual Clouds) → Workloads

**Learn more**: https://docs.controlplane.com/

### Prerequisites

#### 1. Install Control Plane CLI

**macOS (Homebrew)**:
```bash
brew install controlplane-com/tap/cpln
```

**macOS/Linux (Direct)**:
```bash
curl -fsSL https://downloads.controlplane.com/install.sh | sh
```

**Windows (PowerShell)**:
```powershell
iwr https://downloads.controlplane.com/install.ps1 -useb | iex
```

**Verify installation**:
```bash
cpln version
```

#### 2. Authenticate

```bash
# Login to Control Plane
cpln login

# Set default organization (recommended)
cpln profile update default --org zyngl

# Verify authentication
cpln profile current
```

### Build and Push Docker Image

**Important**: Change the version tag each time you build a new image. Never reuse version numbers.

#### Using Semantic Versioning (Recommended for Production)

```bash
# Format: vMAJOR.MINOR.PATCH (e.g., v1.0.0, v1.2.3)
VERSION="v1.0.1"  # Increment this for each release

cpln image build \
  --dockerfile ./Dockerfile \
  --name parrit-api:$VERSION \
  --push \
  --org zyngl
```

#### Using Git Commit SHA (Recommended for Development)

```bash
# Automatically use current git commit as version
VERSION=$(git rev-parse --short HEAD)

cpln image build \
  --dockerfile ./Dockerfile \
  --name parrit-api:$VERSION \
  --push \
  --org zyngl
```

#### Manual Version Tags

```bash
# Build with specific version
cpln image build \
  --dockerfile ./Dockerfile \
  --name parrit-api:002 \
  --push \
  --org zyngl

# Next build - increment the number
cpln image build \
  --dockerfile ./Dockerfile \
  --name parrit-api:003 \
  --push \
  --org zyngl
```

**Build Command Breakdown**:
- `--dockerfile ./Dockerfile` - Path to Dockerfile
- `--name parrit-api:VERSION` - Image name and tag (change VERSION each time!)
- `--push` - Automatically push to Control Plane registry after building
- `--org zyngl` - Your organization name (determines registry namespace)

**Full image path in registry**: `//image/zyngl/parrit-api:VERSION`

### Initial Setup (One-Time Configuration)

#### 1. Create Global Virtual Cloud (GVC)

```bash
# Create GVC for production environment
cpln gvc create parrit \
  --org zyngl \
  --location gcp-us-central1
```

#### 2. Create Secrets for Sensitive Data

```bash
# MongoDB connection string
cpln secret create mongodb-uri \
  --gvc parrit \
  --data "mongodb+srv://admin:password@cluster.mongodb.net/?retryWrites=true&w=majority" \
  --org zyngl

# Firebase service account (single-line JSON)
cpln secret create firebase-service-account \
  --gvc parrit \
  --data '{"type":"service_account","project_id":"parrit-fc705","private_key":"..."}' \
  --org zyngl
```

### Deploy Workload

#### First Deployment (Create Workload)

```bash
cpln workload create \
  --name parrit-api \
  --gvc parrit \
  --image //image/zyngl/parrit-api:v1.0.0 \
  --cpu 1 \
  --memory 1Gi \
  --port 3000 \
  --env NODE_ENV=production \
  --env DATABASE_NAME=parrit \
  --env-from-secret MONGODB_URI=mongodb-uri \
  --env-from-secret FIREBASE_SERVICE_ACCOUNT=firebase-service-account \
  --min-scale 1 \
  --max-scale 5 \
  --org zyngl
```

#### Update Existing Workload (Deploy New Version)

```bash
# Deploy new version
cpln workload update parrit-api \
  --gvc parrit-prod \
  --image //image/zyngl/parrit-api:v1.0.1 \
  --org zyngl
```

### Version Tagging Best Practices

**Semantic Versioning (Production)**:
- `v1.0.0` - Major release (breaking changes)
- `v1.1.0` - Minor release (new features, backward compatible)
- `v1.1.1` - Patch release (bug fixes)

**Development Tags**:
- Git SHA: `abc1234` (traceability to exact code)
- Date-based: `2025-11-01` (time-based tracking)
- Branch-based: `feature-auth` (feature testing)

**Rules**:
1. **Never reuse tags** - Each build must have a unique version
2. **Match git tags** - Tag your git commits to match image versions
3. **Document changes** - Keep a CHANGELOG.md for version history
4. **Avoid `latest`** - Always use explicit versions in production

**Example Workflow**:
```bash
# Tag your git commit
git tag v1.0.1
git push --tags

# Build and push with same version
cpln image build --name parrit-api:v1.0.1 --push --org zyngl

# Deploy the specific version
cpln workload update parrit-api --image //image/zyngl/parrit-api:v1.0.1 --org zyngl
```

### Environment Variables Management

#### Direct Environment Variables (Non-Sensitive)

```bash
cpln workload update parrit-api \
  --gvc parrit-prod \
  --env NODE_ENV=production \
  --env DATABASE_NAME=parrit \
  --org zyngl
```

#### Using Secrets (Sensitive Data)

```bash
# Create secret
cpln secret create my-secret \
  --gvc parrit-prod \
  --data "secret-value" \
  --org zyngl

# Reference in workload
cpln workload update parrit-api \
  --gvc parrit-prod \
  --env-from-secret MY_VAR=my-secret \
  --org zyngl
```

#### Update Secret Values

```bash
# Update existing secret
cpln secret update mongodb-uri \
  --gvc parrit-prod \
  --data "new-connection-string" \
  --org zyngl

# Restart workload to pick up new value
cpln workload restart parrit-api --gvc parrit-prod --org zyngl
```

### Monitoring and Operations

#### View Deployment Status

```bash
cpln workload get parrit-api \
  --gvc parrit-prod \
  --org zyngl
```

#### Stream Logs

```bash
# Follow logs in real-time
cpln workload logs parrit-api \
  --gvc parrit-prod \
  --org zyngl \
  --follow

# View last 100 lines
cpln workload logs parrit-api \
  --gvc parrit-prod \
  --org zyngl \
  --tail 100

# Filter by time (last hour)
cpln workload logs parrit-api \
  --gvc parrit-prod \
  --org zyngl \
  --since 1h
```

#### Get Public Endpoint URL

```bash
cpln workload get parrit-api \
  --gvc parrit-prod \
  --org zyngl \
  --output json | jq -r '.status.endpoint'
```

#### Scale Workload

```bash
# Adjust scaling parameters
cpln workload update parrit-api \
  --gvc parrit-prod \
  --min-scale 2 \
  --max-scale 10 \
  --org zyngl
```

#### Rollback to Previous Version

```bash
# Deploy previous stable version
cpln workload update parrit-api \
  --gvc parrit-prod \
  --image //image/zyngl/parrit-api:v1.0.0 \
  --org zyngl
```

#### Restart Workload

```bash
# Restart all replicas
cpln workload restart parrit-api \
  --gvc parrit-prod \
  --org zyngl
```

### Common Commands Reference

```bash
# List all workloads in GVC
cpln workload get --gvc parrit-prod --org zyngl

# List all images in registry
cpln image get --org zyngl

# Delete old image version
cpln image delete parrit-api:old-version --org zyngl

# View workload replicas
cpln workload replica list parrit-api --gvc parrit-prod --org zyngl

# Get workload metrics
cpln workload metrics parrit-api --gvc parrit-prod --org zyngl

# List all secrets
cpln secret get --gvc parrit-prod --org zyngl

# View GVC details
cpln gvc get parrit-prod --org zyngl
```

### CI/CD Integration

#### GitHub Actions Example

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Control Plane Production

on:
  push:
    tags:
      - 'v*'  # Trigger on version tags (e.g., v1.0.0)

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Install Control Plane CLI
        run: |
          curl -fsSL https://downloads.controlplane.com/install.sh | sh
          echo "$HOME/.cpln/bin" >> $GITHUB_PATH

      - name: Authenticate with Control Plane
        run: |
          cpln profile create github-actions \
            --token ${{ secrets.CPLN_TOKEN }} \
            --org zyngl

      - name: Build and Push Docker Image
        run: |
          VERSION=${GITHUB_REF#refs/tags/}
          echo "Building version: $VERSION"

          cpln image build \
            --dockerfile ./Dockerfile \
            --name parrit-api:$VERSION \
            --push \
            --org zyngl

      - name: Deploy to Production
        run: |
          VERSION=${GITHUB_REF#refs/tags/}
          echo "Deploying version: $VERSION"

          cpln workload update parrit-api \
            --gvc parrit-prod \
            --image //image/zyngl/parrit-api:$VERSION \
            --org zyngl

      - name: Verify Deployment
        run: |
          echo "Waiting for deployment to stabilize..."
          sleep 30

          cpln workload get parrit-api \
            --gvc parrit-prod \
            --org zyngl
```

**Required GitHub Secrets**:
- `CPLN_TOKEN`: Create a service token at https://console.controlplane.com/profile/tokens

**Usage**:
```bash
# Create and push a version tag
git tag v1.0.1
git push origin v1.0.1

# GitHub Actions will automatically build and deploy
```

### Troubleshooting

#### Build Fails with Permission Error

```bash
# Ensure you're authenticated
cpln login

# Verify organization access
cpln org get zyngl

# Check your profile
cpln profile current
```

#### Workload Not Starting

```bash
# Check workload status and events
cpln workload get parrit-api --gvc parrit-prod --org zyngl

# View detailed logs for errors
cpln workload logs parrit-api --gvc parrit-prod --org zyngl --follow

# Check replica status
cpln workload replica list parrit-api --gvc parrit-prod --org zyngl
```

#### Environment Variables Not Loading

```bash
# Verify secrets exist
cpln secret get --gvc parrit-prod --org zyngl

# Check workload environment configuration
cpln workload get parrit-api \
  --gvc parrit-prod \
  --org zyngl \
  --output json | jq '.spec.containers[0].env'

# Restart workload to reload environment
cpln workload restart parrit-api --gvc parrit-prod --org zyngl
```

#### Database Connection Issues

```bash
# Test MongoDB connection string
# (Run locally first with the connection string from secrets)

# Check if workload can reach MongoDB
cpln workload logs parrit-api --gvc parrit-prod --org zyngl | grep -i mongo

# Verify secret value
cpln secret get mongodb-uri --gvc parrit-prod --org zyngl
```

#### Cannot Access Deployed API

```bash
# Get the public endpoint
cpln workload get parrit-api \
  --gvc parrit-prod \
  --org zyngl \
  --output json | jq -r '.status.endpoint'

# Check if workload is healthy
cpln workload get parrit-api --gvc parrit-prod --org zyngl

# View recent logs for HTTP errors
cpln workload logs parrit-api --gvc parrit-prod --org zyngl --tail 50
```

### Additional Resources

- **Control Plane Documentation**: https://docs.controlplane.com/
- **CLI Reference**: https://docs.controlplane.com/reference/cli
- **Workload Guide**: https://docs.controlplane.com/guides/workload
- **Image Registry**: https://docs.controlplane.com/reference/image
- **Secrets Management**: https://docs.controlplane.com/reference/secret
- **Console UI**: https://console.controlplane.com/

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
