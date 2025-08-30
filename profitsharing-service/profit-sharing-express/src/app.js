const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const openapiPath = path.join(__dirname, '..', 'openapi.yaml');
const swaggerDoc = YAML.load(openapiPath);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.use('/', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
