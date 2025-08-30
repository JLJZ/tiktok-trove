const request = require('supertest');
const app = require('../src/app');

describe('Profit Sharing API', () => {
  let psaId;
  test('POST /profit-shares creates PSA', async () => {
    const res = await request(app)
      .post('/profit-shares')
      .set('Idempotency-Key','abc123')
      .send({
        contentId: 'vid_8f3e',
        title: 'Demo',
        cycle: 'WEEKLY',
        currency: 'USD',
        participants: [
          { handle: 'main', role: 'MAIN_CREATOR', walletId: 'wal_main' },
          { handle: 'collab', role: 'COLLABORATOR', walletId: 'wal_col' },
          { handle: 'platform', role: 'PLATFORM', walletId: 'wal_platform' }
        ],
        rules: {
          splitType: 'PERCENTAGE',
          preDeductions: { platformFeePercent: 5 },
          splits: [
            { ref: { role: 'PLATFORM' }, share: 5 },
            { ref: { role: 'MAIN_CREATOR' }, share: 70 },
            { ref: { role: 'COLLABORATOR' }, share: 25 }
          ]
        }
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    psaId = res.body.id;
  });

  test('GET /profit-shares/:id returns PSA', async () => {
    const res = await request(app).get(`/profit-shares/${psaId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(psaId);
  });

  test('POST /revenue-events records event', async () => {
    const res = await request(app)
      .post('/revenue-events')
      .send({
        psaId,
        stream: 'TIPS',
        amountCents: 1000,
        currency: 'USD',
        occurredAt: new Date().toISOString()
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.psaId).toBe(psaId);
  });

  test('POST /settlements creates settlement', async () => {
    const start = new Date(Date.now()-86400000).toISOString();
    const end = new Date().toISOString();
    const res = await request(app)
      .post('/settlements')
      .send({ psaId, period: { start, end }, dryRun: false });
    expect(res.statusCode).toBe(202);
    expect(res.body.psaId).toBe(psaId);
    expect(res.body.allocations.length).toBeGreaterThan(0);
  });

  test('GET /profit-shares/unknown -> 404', async () => {
    const res = await request(app).get('/profit-shares/psa_xyz');
    expect(res.statusCode).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
