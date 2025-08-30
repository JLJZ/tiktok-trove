const express = require('express');
const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');
const OpenApiValidator = require('express-openapi-validator');

const { port, dataBackend } = require('./config');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const VideoService = require('./services/video.service');
const VideoController = require('./controllers/video.controller');
const videoRoutes = require('./routes/video.routes');

const { InMemoryVideoRepository } = require('./repositories/inMemoryVideo.repository');
const { PostgresVideoRepository } = require('./repositories/postgresVideo.repository');

function buildRepository() {
  if (dataBackend === 'postgres') return new PostgresVideoRepository();
  return new InMemoryVideoRepository();
}

const app = express();
app.use(express.json());

// OpenAPI spec & Swagger UI
const specPath = path.join(__dirname, '..', 'openapi.yaml');
const spec = YAML.parse(fs.readFileSync(specPath, 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

// Request validation
app.use(
  OpenApiValidator.middleware({
    apiSpec: specPath,
    validateRequests: true,
    validateResponses: false,
  })
);

// Routes
const repo = buildRepository();
const service = new VideoService(repo);
const controller = new VideoController(service);
app.use('/', videoRoutes(controller));

// 404 & error handling
app.use(notFound);
app.use(errorHandler);

module.exports = { app, port };
