# TikTok Gifting API (Express + Vitest)

A minimal, testable ExpressJS service scaffolded from your OpenAPI. Ships with
controllers, services, in-memory repo (seeded from JSON), validation (Zod),
and full HTTP tests (Vitest + Supertest).

> Generated on 2025-08-30T13:00:18.261214

## Endpoints

- GET `/health` → { ok: true }
- GET `/gifts/catalog` → list seed gifts
- POST `/gifts/send` → send a gift (`{ videoId, giftId, qty }`) — uses `x-user-id` header as sender
- GET `/gifts/video/:videoId` → list gifts sent for a video
- GET `/wallet/transactions` → 501 placeholder

See `openapi.yaml` for the contract.

## Quick start

```bash
cp .env.example .env
npm i
npm run dev
# http://localhost:3000/health
```

## Run tests

```bash
npm run test
# or: npm run test:watch
```

## Swap to a real DB later

Create a new repo in `src/repositories/` (e.g. `postgresRepo.js`) that implements:
- `getCatalog()`
- `addGiftToVideo(entry)`
- `getGiftsForVideo(videoId)`

Then toggle it inside `src/repositories/index.js` based on `process.env.DB_URL`.
