import request from 'supertest';
import { createApp } from '../src/app.js';
import { describe, it, expect, beforeAll } from 'vitest';

let app;
beforeAll(async () => { app = await createApp(); });

describe('Gifts API', () => {
  it('GET /gifts/catalog returns seed catalog', async () => {
    const res = await request(app).get('/gifts/catalog');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(i => i.id && i.priceCoins >= 0)).toBe(true);
  });

  it('POST /gifts/send validates body', async () => {
    const bad = await request(app).post('/gifts/send').send({ giftId: 'rose' });
    expect(bad.status).toBe(400);
  });

  it('POST /gifts/send happy path + GET by video', async () => {
    const send = await request(app)
      .post('/gifts/send')
      .set('x-user-id', 'u123')
      .send({ videoId: 'v1', giftId: 'rose', qty: 3 });

    expect(send.status).toBe(201);
    expect(send.body.coinsCharged).toBeGreaterThan(0);

    const list = await request(app).get('/gifts/video/v1');
    expect(list.status).toBe(200);
    expect(list.body).toEqual(
      expect.arrayContaining([ expect.objectContaining({ giftId: 'rose', qty: 3, senderId: 'u123' }) ])
    );
  });

  it('POST /gifts/send 404 for missing giftId', async () => {
    const res = await request(app)
      .post('/gifts/send')
      .send({ videoId: 'v2', giftId: 'nope', qty: 1 });
    expect(res.status).toBe(404);
  });

  it('GET /wallet/transactions returns 501 placeholder', async () => {
    const res = await request(app).get('/wallet/transactions');
    expect(res.status).toBe(501);
  });
});
