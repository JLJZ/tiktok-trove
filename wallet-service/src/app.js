const express = require('express');
const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');
const OpenApiValidator = require('express-openapi-validator'); // <-- single import

const { port, dataBackend, coinPackages } = require('./config');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const WalletService = require('./services/wallet.service');
const WalletController = require('./controllers/wallet.controller');
const walletRoutes = require('./routes/wallet.routes');

const InMemoryWalletRepository = require('./repositories/inMemoryWallet.repository');
const PostgresWalletRepository = require('./repositories/postgresWallet.repository');

function buildRepository() {
  if (dataBackend === 'postgres') return new PostgresWalletRepository();
  return new InMemoryWalletRepository({ coinPackages });
}

const app = express();
app.use(express.json());

// OpenAPI spec & Swagger UI
const specPath = path.join(__dirname, '..', 'openapi.yaml');
const spec = YAML.parse(fs.readFileSync(specPath, 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

// ✅ Request validation (middleware API)
app.use(
  OpenApiValidator.middleware({
    apiSpec: specPath,
    validateRequests: true,
    validateResponses: false
  })
);

// Routes
const repo = buildRepository();
const service = new WalletService(repo);
const controller = new WalletController(service);
app.use('/', walletRoutes(controller));

// 404 & error handling
app.use(notFound);
app.use(errorHandler);

module.exports = { app, port };
