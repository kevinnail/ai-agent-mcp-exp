# Full-Stack React + Express Template

A ready-to-use template for building full-stack applications with React and Express.

## Features

- React frontend with Create React App
- Express backend with ES6 modules
- PostgreSQL database with connection pooling
- JWT authentication with bcrypt password hashing
- Zustand for state management (replacing React Context)
- ESLint and Prettier configured
- Jest and Supertest for testing
- Concurrent development server
- Proxy configuration for API calls
- User authentication system with protected routes

## Prerequisites

Before setting up this project, ensure you have:

- Node.js (v16 or higher)
- PostgreSQL database
- Git

## Quick Start

1. **Clone this repository**

   ```bash
   git clone <repository-url>
   cd my-fullstack-template
   ```

2. **Install dependencies**

   ```bash
   npm run install-all
   ```

3. **Set up environment variables**

   Create a `.env` file in the `server` directory with the following variables:

   ```env
   PG_USER=your_postgres_username
   PG_HOST=localhost
   PG_DATABASE=your_database_name
   PG_PASSWORD=your_postgres_password
   PG_PORT=5432
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Set up the database**

   ```bash
   cd server
   npm run setup-db
   ```

5. **Start the development servers**

   ```bash
   # From the root directory
   npm run dev
   ```

   This will start both the React frontend (port 3000) and Express backend (port 5000) concurrently.

## Available Scripts

### Root Level

- `npm run dev` - Start both frontend and backend in development mode
- `npm run install-all` - Install dependencies for all projects
- `npm run test` - Run tests for both frontend and backend
- `npm run lint` - Run linting for both projects
- `npm run format` - Format code for both projects

### Client (Frontend)

- `npm run client` - Start React development server
- `npm run build` - Build for production
- `npm test` - Run React tests
- `npm run lint` - Lint React code
- `npm run format` - Format React code

### Server (Backend)

- `npm run server` - Start Express server
- `npm run start:watch` - Start server with nodemon for development
- `npm test` - Run server tests
- `npm run setup-db` - Set up database tables
- `npm run lint` - Lint server code
- `npm run format` - Format server code

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── stores/         # Zustand stores
│   │   ├── hooks/          # Custom hooks
│   │   └── services/        # API services
│   └── public/             # Static assets
├── server/                 # Express backend
│   ├── lib/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── utils/           # Utility functions
│   ├── sql/                # Database setup files
│   └── __tests__/          # Server tests
└── package.json            # Root package configuration
```

## Database Setup

The project uses PostgreSQL. Make sure you have PostgreSQL installed and running:

1. Create a database for your project
2. Update the environment variables in `server/.env`
3. Run `npm run setup-db` from the server directory to create tables

## Authentication

The template includes a complete authentication system:

- User registration and login
- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes on the frontend
- Authentication middleware on the backend

## Development Tips

- The React app runs on `http://localhost:3000`
- The Express API runs on `http://localhost:5000`
- API calls from React are automatically proxied to the backend
- Use `npm run dev` to start both servers simultaneously
- Check the browser console and terminal for any errors

## Production Deployment

1. Build the React app: `cd client && npm run build`
2. Set production environment variables
3. Start the server: `cd server && npm start`

## Troubleshooting

- **Database connection issues**: Verify your PostgreSQL credentials in `.env`
- **Port conflicts**: Ensure ports 3000 and 5000 are available
- **Module errors**: Run `npm run install-all` to ensure all dependencies are installed
- **Authentication issues**: Check that JWT_SECRET is set in your environment variables
