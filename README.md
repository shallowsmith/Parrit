# Parrit

Voice Activated Finance Tracker

## Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
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