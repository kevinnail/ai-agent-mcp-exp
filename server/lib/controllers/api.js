import express from 'express';
import { getToolsFromMcpServer } from '../services/McpService.js';

const router = express.Router();

// Sample API endpoint
router.get('/hello', (req, res) => {
  const tools = getToolsFromMcpServer();

  res.json({ message: 'Hello from the API!', tools });
});

// Add more routes here

export default router;
