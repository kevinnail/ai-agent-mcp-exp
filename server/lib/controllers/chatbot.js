import express from 'express';

const router = express.Router();

// Sample API endpoint
router.get('/', async (req, res) => {
  res.json({ message: 'Hello from the NEW API super duper!' });
});

export default router;
