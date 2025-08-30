/**
 * Integration/E2E for Video + Gift:
 * - Starts both services (in-memory), uploads a dummy video,
 * - Sends a "rose" gift, then verifies it appears in /gifts/video/:id,
 * - Also checks unknown giftId → 404.
 *
 * Notes: run with DATA_BACKEND=memory and ensure "rose" exists in seeds/gifts.json.
 * (Gateway/DB/AML/fraud/video-existence checks are out of scope here.)
 */

import http from 'http';
import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { createApp as createGiftApp } from '../../src/app.js';

function listenOnRandomPort(app) {
return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, () => resolve(server));
});
}

let giftServer, videoServer, giftURL, videoURL;

beforeAll(async () => {
// boot Gift service
const giftApp = await createGiftApp();
giftServer = await listenOnRandomPort(giftApp);
giftURL = `http://127.0.0.1:${giftServer.address().port}`;

// boot Video service (CJS module)
const videoMod = await import('../../../video-service/src/app'); // CJS -> synthetic module
const videoApp = videoMod.app;
videoServer = await listenOnRandomPort(videoApp);
videoURL = `http://127.0.0.1:${videoServer.address().port}`;
});

afterAll(async () => {
if (giftServer) await new Promise((r) => giftServer.close(r));
if (videoServer) await new Promise((r) => videoServer.close(r));
});

describe('Video + Gift E2E', () => {
it('uploads a video then sends & lists gifts for it', async () => {
    // 1) Upload video
    const up = await request(videoURL)
    .post('/videos')
    .set('x-user-id', 'u-creator-1')
    .attach('file', Buffer.from('dummy-bytes'), 'clip.mp4')
    .field('title', 'Integration Clip');
    expect(up.status).toBe(201);
    const videoId = up.body.id;

    // 2) Send gift (uses gift seed "rose")
    const send = await request(giftURL)
    .post('/gifts/send')
    .set('x-user-id', 'u-fan-1')
    .send({ videoId, giftId: 'rose', qty: 2 });
    expect(send.status).toBe(201);
    expect(send.body.coinsCharged).toBeGreaterThan(0);

    // 3) List gifts for that video
    const list = await request(giftURL).get(`/gifts/video/${videoId}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.some(g => g.giftId === 'rose' && g.qty === 2 && g.senderId === 'u-fan-1')).toBe(true);
});

it('rejects bad gift (unknown giftId) via Gift service', async () => {
    const bad = await request(giftURL)
    .post('/gifts/send')
    .send({ videoId: 'whatever', giftId: 'nope', qty: 1 });
    expect(bad.status).toBe(404);
});
});
