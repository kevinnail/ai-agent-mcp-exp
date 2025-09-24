import request from 'supertest';
import app from '../lib/app.js';

describe('Server Tests', () => {
  describe('GET /api/v1/hello', () => {
    it('should return hello message', async () => {
      const response = await request(app).get('/api/v1/api/hello');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Hello from the API!');
    });
  });
});
