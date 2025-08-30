const request = require('supertest');
process.env.DATA_BACKEND = 'memory';
const { app } = require('../src/app');

describe('Video API', () => {
  const agent = request(app);
  const userHeader = { 'x-user-id': 'u1' };
  let videoId;

  test('POST /videos uploads a video', async () => {
    const res = await agent
      .post('/videos')
      .set(userHeader)
      .attach('file', Buffer.from('dummy'), 'dummy.mp4')
      .field('title', 'Test Video');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('cdnUrl');
    videoId = res.body.id;
  });

  test('GET /videos/:id returns metadata', async () => {
    const res = await agent.get(`/videos/${videoId}`).set(userHeader);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', videoId);
    expect(res.body).toHaveProperty('title', 'Test Video');
  });

  test('GET /videos/:id/stats returns stats', async () => {
    const res = await agent.get(`/videos/${videoId}/stats`).set(userHeader);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ views: 0, likes: 0, giftsReceived: 0 });
  });

  test('DELETE /videos/:id deletes the video', async () => {
    const res = await agent.delete(`/videos/${videoId}`).set(userHeader);
    expect(res.status).toBe(204);
  });

  test('GET deleted video -> 404', async () => {
    const res = await agent.get(`/videos/${videoId}`).set(userHeader);
    expect(res.status).toBe(404);
  });

  test('Unknown route -> 404', async () => {
    const res = await agent.get('/nope');
    expect(res.status).toBe(404);
  });
});
