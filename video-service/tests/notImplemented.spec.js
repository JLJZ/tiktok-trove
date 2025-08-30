// video-service/tests/notimplemented.spec.js
const request = require('supertest');

describe('Not implemented backend returns 501', () => {
  test('GET /videos/:id -> 501 with postgres backend', async () => {
    process.env.DATA_BACKEND = 'postgres';

    jest.resetModules();
    const { app } = require('../src/app');

    const res = await request(app).get('/videos/dummy-id');

    expect(res.status).toBe(501);
  });

  test('POST /videos -> 501 with postgres backend', async () => {
    process.env.DATA_BACKEND = 'postgres';
    jest.resetModules();
    const { app } = require('../src/app');

    const res = await request(app)
      .post('/videos')
      .set('x-user-id', 'u1')
      .attach('file', Buffer.from('dummy'), 'dummy.mp4')
      .field('title', 'Test Video');

    expect(res.status).toBe(501);
  });
});
