# Profit Sharing API (Express + Jest)

A lean ExpressJS scaffold that implements the endpoints from the Profit Sharing OpenAPI spec with:
- Controllers & routes
- In-memory and file-backed stores (switch via `DATA_BACKEND`)
- Idempotency-Key support
- Zod validation for request payloads
- Settlement engine that applies percentage splits
- Swagger UI at `/docs` (loads `openapi.yaml`)
- Jest + Supertest tests

## Quick start

```bash
npm i
cp .env.example .env
npm run dev
# open http://localhost:3000/docs
```

## Switch storage

- **In-memory (default)**: `DATA_BACKEND=memory` (fast, ephemeral)
- **File-backed JSON**: `DATA_BACKEND=file` and set `DATA_FILE_PATH=./data.json`

## Test

```bash
npm test
```

## Project layout

```
src/
  server.js
  app.js
  routes/
  controllers/
  middleware/
  store/
  services/
  schemas/
  utils/
openapi.yaml
```

## API Flow (happy path)

1. **Create PSA** → `POST /profit-shares`
2. **Add participants** → `POST /profit-shares/{psaId}/participants`
3. **Record revenue** → `POST /revenue-events`
4. **Run settlement** → `POST /settlements` (computes allocations immediately)
5. **Create payouts** → `POST /settlements/{id}/payouts`
6. **Track payout** → `GET /payouts/{payoutId}`

## Error model

All errors return JSON: `{ "code": "STRING", "message": "Human readable" }` with appropriate HTTP status.
