import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import users from './controllers/users.js';
import testApi from './controllers/api.js';
import notFound from './middleware/not-found.js';
import errorHandler from './middleware/error.js';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'Mcp-Session-Id'],
  })
);

app.use(express.json());
app.use(cookieParser());

// Use the imported routers
app.use('/api/v1/users', users);
app.use('/api/v1/api', testApi);

// Error handling & 404 middleware for when
// a request doesn't match any app routes
app.use(notFound);
app.use(errorHandler);

export default app;
