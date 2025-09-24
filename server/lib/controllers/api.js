import express from 'express';

const router = express.Router();

// Sample API endpoint
router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from the API!' });
});

// Add more routes here

export default router;
