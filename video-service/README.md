# Wallet Service (Express + OpenAPI)

This service implements the Wallet API from `openapi.yaml` with a clean, testable architecture:
- **Controllers** map HTTP to services.
- **Services** hold business logic.
- **Repositories** provide a swappable data layer: in-memory (default) or a future Postgres impl.
- **OpenAPI validation** for runtime request validation.
- **Error handling** for 400/404/501/500.
- **Jest + Supertest** tests.
- **VSCode** launch config and REST Client requests.

## Quick Start

```bash
npm i
cp .env.example .env
npm run dev
# Open Swagger UI: http://localhost:3000/docs
npm test
```

## Switch data backend

Default is in-memory. To simulate an unimplemented DB layer (for 501 responses):

```bash
DATA_BACKEND=postgres npm run dev
```

## Env-driven values

Important values (like coin package sizes) are not hardcoded. Provide a JSON map via `COIN_PACKAGES`, e.g.:

```bash
COIN_PACKAGES='{"PKG_499":500,"PKG_999":1000,"PKG_1999":2100}' npm run dev
```

## Architectural decision prompts

See `docs/ARCHITECTURE_PROMPTS.md` for copy‑paste prompts to ask your AI assistant when making decisions (DB selection, auth, pagination, idempotency, etc.).
