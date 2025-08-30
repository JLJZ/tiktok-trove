const request = require('supertest');

describe('Not implemented backend returns 501', () => {
  test('GET /wallet -> 501 with postgres backend', async () => {
    process.env.DATA_BACKEND = 'postgres';
    const { app } = require('../src/app');
    const res = await request(app).get('/wallet');
    expect(res.status).toBe(501);
  });
});
