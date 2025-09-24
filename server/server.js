import 'dotenv/config';
import app from './lib/app.js';

const PORT = process.env.PORT || 5000;
// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
