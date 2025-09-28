import express from 'express';

const router = express.Router();

// Sample API endpoint
router.post('/', async (req, res) => {
  console.log('did we make it? ', req.body);
  res.json({ message: 'Hello from the NEW API super duper!' });
});

export default router;
