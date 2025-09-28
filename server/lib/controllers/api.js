import express from 'express';
import { getToolsFromMcpServer } from '../services/McpService.js';

const router = express.Router();

// Sample API endpoint
router.get('/hello', async (req, res) => {
  const tools = await getToolsFromMcpServer();
  res.json({ message: 'Hello from the API!', tools });
});

// Add more routes here

export default router;
