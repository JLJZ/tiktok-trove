# TikTok Trove — Transparent Profit Sharing for Short-Form Video & LIVE

Rebuilding TikTok-style profit sharing with explainability by default—every cent traceable, every split auditable, fraud-resilient from day one.

Relevant challenge: TikTok TechJam 2025 — Problem Statement #6 (Value-Sharing Reimagined)
Focus: profit-sharing mechanisms, value transfer (viewer-to-creator), performance and fund safety.

# Inspiration

Creators keep asking a simple question with no simple answer: “Where did my money go?”
Coins/diamonds, multiple collaborators, music rights, platform fees—splits are opaque. Disputes drag on because there’s no end-to-end trace. CreatorAmp makes the split itself a first-class product with audit-grade receipts.

# What It Does (Features)

**Split Engine**
Model each monetizable post as a graph of creators. Compute payouts per revenue source (ads and posts). Engine surfaces via the API-Gateway in this repo.

**Wallet & Gifting**

**Wallet:** balances, coin purchase, coins↔diamonds conversion, transaction history.

**Gifting:** gift catalog, send gift to a video, per-video gift ledger.

**Video Ingest (Demo)**
Upload short videos (mock storage), read metadata & simple view stats.

**Audit Trail**
Append-only events designed for replay & exact recomputation by policy version.

# Architecture & Repo Layout

Monorepo (multi-service) with clear separation of concerns:
```
tiktok-trove/
├─ api-gateway/            # Edge API; routes → wallet, video, gifts, (fraud hooks)
├─ wallet-service/         # Wallet balances, coin purchase, diamonds conversion, tx history
├─ gift-service/           # Gift catalog, send gifts, per-video gift ledger (in-memory repo)
├─ video-service/          # Demo video upload/metadata/stats (multer-based)
└─ client/
   └─ lynx-app/            # Prototype mobile-like UI (React Lynx), demo-only
```
Note: A docker-compose.yml scaffold exists but is intentionally minimal. For hackathon reliability we recommend manual local runs (see below).

# APIs & Endpoints
## API Gateway (Node/Express) — single entry point
Proxies/coordinates the underlying services and exposes unified endpoints.

Method	Path	Purpose
GET	/health	Liveness + configured downstream service URLs
POST	/auth/register	(Scaffold) demo auth endpoint
POST	/auth/login	(Scaffold) demo auth endpoint
GET	/users/:id	(Scaffold) user profile passthrough
PUT	/users/:id	(Scaffold) update profile
POST	/videos	Upload short video (multipart)
GET	/videos/:id	Fetch video metadata
DELETE	/videos/:id	Delete a video
GET	/videos/:id/stats	Basic stats
GET	/gifts/catalog	List available gifts (coins price)
POST	/gifts/send	Send a gift to a video
GET	/gifts/video/:videoId	List gifts for a video
GET	/wallet	Get wallet balances (coins, diamonds)
POST	/wallet/coins/purchase	Purchase coin package
POST	/wallet/diamonds/convert	Convert coins→diamonds
GET	/wallet/transactions	Transaction history

## Wallet Service
Swagger docs: http://localhost:<WALLET_PORT>/docs
Endpoints implemented:
GET /wallet
POST /wallet/coins/purchase
POST /wallet/diamonds/convert
GET /wallet/transactions

## Gift Service
Endpoints implemented:
GET /gifts/catalog
POST /gifts/send
GET /gifts/video/:videoId

## Video Service
Swagger docs: http://localhost:<VIDEO_PORT>/docs
Endpoints implemented:
POST /videos 
GET /videos/:id
DELETE /videos/:id
GET /videos/:id/stats

# Getting Started (Local Dev)
Prerequisites
-Node.js v18+
-npm or pnpm
-(Optional) Postgres — not required for the demo; in-memory repos are provided.

**1) Clone**
```
git clone https://github.com/JLJZ/tiktok-trove.git
cd tiktok-trove
```

**2) Install per service**
```
# API Gateway
cd api-gateway && npm i

# Wallet Service
cd ../wallet-service && npm i

# Gift Service
cd ../gift-service && npm i

# Video Service
cd ../video-service && npm i

# Client (optional demo UI)
cd ../client/lynx-app && npm i   # or pnpm i
```

**3) Configure .env (ports & options)**
Create .env files by copying the provided examples and match the ports below:

Service	Example Port	Env file to create
API Gateway	3000	api-gateway/.env
Wallet Service	3005	wallet-service/.env
Gift Service	3004	gift-service/.env
Video Service	3003	video-service/.env

Set these URLs in api-gateway/.env:
PORT=3000
JWT_SECRET=dev-secret
AUTH_SERVICE_URL=http://localhost:3001     # (scaffold)
USER_SERVICE_URL=http://localhost:3002     # (scaffold)
VIDEO_SERVICE_URL=http://localhost:3003
GIFT_SERVICE_URL=http://localhost:3004
WALLET_SERVICE_URL=http://localhost:3005
FRAUD_SERVICE_URL=http://localhost:3006    # (optional/mock)

Use the provided *.env.example files inside each service as a guide.

**4) Run services (in separate terminals)**
```
# Wallet
cd wallet-service && npm run dev
# -> http://localhost:3005  (docs: /docs)

# Gifts
cd gift-service && npm run dev
# -> http://localhost:3004

# Video
cd video-service && npm run dev
# -> http://localhost:3003  (docs: /docs)

# API Gateway
cd api-gateway && npm run dev
# -> http://localhost:3000
```

**Environment Variables**
Each service ships an .env.example:
**wallet-service/.env.example**
```
DATA_BACKEND=memory              # or postgres (not required for demo)
PORT=3005
COIN_PACKAGES=                   # optional JSON map, else defaults in config.js
```

**video-service/.env.example**
```
PORT=3003
DATA_BACKEND=memory
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=video/mp4,video/quicktime
```

**gift-service/.env.example**
```
PORT=3004
NODE_ENV=development
# DB_URL=postgres://user:pass@host:5432/db   # optional; in-memory by default
```

**api-gateway/.env (create it)**
```
PORT=3000
JWT_SECRET=dev-secret
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
VIDEO_SERVICE_URL=http://localhost:3003
GIFT_SERVICE_URL=http://localhost:3004
WALLET_SERVICE_URL=http://localhost:3005
FRAUD_SERVICE_URL=http://localhost:3006
```

**Testing**
```
# Wallet (Jest + Supertest)
cd wallet-service
npm test

# Video (Jest + Supertest)
cd ../video-service
npm test

# Gifts (Vitest + Supertest)
cd ../gift-service
npm test

# Client (Vitest)
cd ../client/lynx-app
npm test

# API Gateway (Jest) – scaffolded
cd ../../api-gateway
npm test
```

# Tech Stack

**Development tools**
- Node.js 18+, npm/pnpm, VS Code + REST clients (Hoppscotch/Postman)
- OpenAPI (Swagger UI via express-openapi-validator) for wallet/video
- Dockerfile stubs; minimal docker-compose scaffold (manual dev recommended)

**APIs (in repo)**
- API Gateway (Express): unified routes for auth/users/videos/gifts/wallet/fraud hooks
- Wallet API: coin purchase, diamonds conversion, balances, tx history
- Gift API: catalog, send gift, per-video gift list
- Video API: upload/metadata/stats


**Libraries**
- Backend: express, express-openapi-validator, swagger-ui-express, uuid, yaml, multer, helmet, jsonwebtoken, zod
- Testing: jest, vitest, supertest, ts-jest (where applicable)
- Client: @lynx-js/react (React Lynx), basic ESLint/Prettier setup

**Datastores**
In-memory repositories for demo; easy swap points prepared for PostgreSQL later. 

**Assets Used**
- Gift catalog seed: gift-service/seeds/gifts.json
- Client demo assets: icons (client/lynx-app/src/assets/*)
- Video uploads (local): video-service/src/uploads/ (created at runtime)

# Maintainers
Team VibeDance: @JLJZ, @billjohnathan8, @tanialee21, @siewyu, @kahhong — TikTok TechJam 2025
