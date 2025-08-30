# Architecture Decision Prompts (copy‑paste into chat)

1) **Database choice**
- "Given a wallet with coin purchases, diamond conversions, and a transaction ledger, compare Postgres vs. Mongo vs. SQLite for local dev. Include migration strategy, transactions, and event logging."

2) **Consistency & idempotency**
- "Design idempotency for POST /wallet/coins/purchase so retries don't double-charge. Include request id keys, storage, and TTL."

3) **Monetization rules & limits**
- "Propose rate limits and velocity checks for purchase/convert endpoints to reduce fraud. Return example 429 errors with retry-after."

4) **Auth & multi-tenancy**
- "Recommend JWT claims for user identity, tenant, roles. Show an Express middleware and sample OpenAPI securitySchemes."

5) **Transactions & auditing**
- "Sketch SQL tables for wallets and transactions with referential integrity and a durable audit log. Include example SQL migrations."

6) **Pagination & filtering**
- "Add cursor-based pagination to GET /wallet/transactions. Provide OpenAPI changes and code samples."

7) **Observability**
- "Add request logging, structured JSON logs, and metrics (p50/p95). Provide a plan using pino + prom-client."

8) **Error model**
- "Review Error schema and propose a standard error envelope with codes, messages, and correlation IDs."
