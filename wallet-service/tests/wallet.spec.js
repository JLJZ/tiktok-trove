const request = require('supertest');
process.env.DATA_BACKEND = 'memory';
const { app } = require('../src/app');

describe('Wallet API', () => {
  const agent = request(app);
  const userHeader = { 'x-user-id': 'u1' };

  test('GET /wallet returns default balances', async () => {
    const res = await agent.get('/wallet').set(userHeader);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ coins: 0, diamonds: 0 });
  });

  test('POST /wallet/coins/purchase validates body', async () => {
    const res = await agent.post('/wallet/coins/purchase').set(userHeader).send({});
    expect([400, 422]).toContain(res.status); // 422 from validator, 400 from controller guard
  });

  test('Successful coin purchase', async () => {
    const res = await agent.post('/wallet/coins/purchase').set(userHeader).send({ packageId: 'PKG_999' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('transactionId');
    expect(res.body).toHaveProperty('newBalance', 1000);
  });

  test('Convert diamonds insufficient -> 400', async () => {
    const res = await agent.post('/wallet/diamonds/convert').set(userHeader).send({ amount: 10 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('code');
  });

  test('Unknown route -> 404', async () => {
    const res = await agent.get('/nope');
    expect(res.status).toBe(404);
  });
});
