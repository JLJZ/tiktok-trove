require('dotenv').config()
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const multer = require('multer');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Configuration
const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    user: process.env.USER_SERVICE_URL || 'http://user-service:3002',
    video: process.env.VIDEO_SERVICE_URL || 'http://video-service:3003',
    gift: process.env.GIFT_SERVICE_URL || 'http://gift-service:3004',
    wallet: process.env.WALLET_SERVICE_URL || 'http://wallet-service:3005',
    fraud: process.env.FRAUD_SERVICE_URL || 'http://fraud-service:3006'
  }
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Service proxy helper
const proxyToService = async (serviceUrl, path, method = 'GET', data = null, headers = {}) => {
  try {
    const response = await axios({
      method,
      url: `${serviceUrl}${path}`,
      data,
      headers,
      timeout: 10000
    });
    return response;
  } catch (error) {
    if (error.response) {
      throw error;
    }
    throw new Error('Service unavailable');
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: config.services 
  });
});

// Authentication Routes
app.post('/auth/register', [
  body('username').isLength({ min: 3, max: 30 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
], handleValidationErrors, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.auth, 
      '/register', 
      'POST', 
      req.body
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Authentication service error' };
    res.status(status).json(message);
  }
});

app.post('/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], handleValidationErrors, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.auth, 
      '/login', 
      'POST', 
      req.body
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Authentication service error' };
    res.status(status).json(message);
  }
});

// User Routes
app.get('/users/:id', [
  param('id').isLength({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.user, 
      `/users/${req.params.id}`, 
      'GET'
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'User service error' };
    res.status(status).json(message);
  }
});

app.put('/users/:id', authenticateToken, [
  param('id').isLength({ min: 1 }),
  body('displayName').optional().isLength({ max: 100 }),
  body('bio').optional().isLength({ max: 500 })
], handleValidationErrors, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.user, 
      `/users/${req.params.id}`, 
      'PUT', 
      req.body,
      { Authorization: req.headers.authorization }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'User service error' };
    res.status(status).json(message);
  }
});

// Video Routes
app.post('/videos', authenticateToken, upload.single('file'), [
  body('title').isLength({ min: 1, max: 200 })
], handleValidationErrors, async (req, res) => {
  try {
    const formData = new FormData();
    if (req.file) {
      formData.append('file', new Blob([req.file.buffer]), req.file.originalname);
    }
    formData.append('title', req.body.title);

    const response = await proxyToService(
      config.services.video, 
      '/videos', 
      'POST', 
      formData,
      { 
        Authorization: req.headers.authorization,
        'Content-Type': 'multipart/form-data'
      }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Video service error' };
    res.status(status).json(message);
  }
});

app.get('/videos/:id', [
  param('id').isLength({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.video, 
      `/videos/${req.params.id}`, 
      'GET'
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Video service error' };
    res.status(status).json(message);
  }
});

app.delete('/videos/:id', authenticateToken, [
  param('id').isLength({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.video, 
      `/videos/${req.params.id}`, 
      'DELETE',
      null,
      { Authorization: req.headers.authorization }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Video service error' };
    res.status(status).json(message);
  }
});

app.get('/videos/:id/stats', [
  param('id').isLength({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.video, 
      `/videos/${req.params.id}/stats`, 
      'GET'
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Video service error' };
    res.status(status).json(message);
  }
});

// Gift Routes
app.get('/gifts/catalog', async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.gift, 
      '/catalog', 
      'GET'
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Gift service error' };
    res.status(status).json(message);
  }
});

app.post('/gifts/send', authenticateToken, [
  body('videoId').isLength({ min: 1 }),
  body('giftId').isLength({ min: 1 }),
  body('qty').isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.gift, 
      '/send', 
      'POST', 
      req.body,
      { Authorization: req.headers.authorization }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Gift service error' };
    res.status(status).json(message);
  }
});

app.get('/gifts/video/:videoId', [
  param('videoId').isLength({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.gift, 
      `/video/${req.params.videoId}`, 
      'GET'
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Gift service error' };
    res.status(status).json(message);
  }
});

// Wallet Routes
app.get('/wallet', authenticateToken, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.wallet, 
      '/wallet', 
      'GET',
      null,
      { Authorization: req.headers.authorization }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Wallet service error' };
    res.status(status).json(message);
  }
});

app.post('/wallet/coins/purchase', authenticateToken, [
  body('packageId').isLength({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.wallet, 
      '/coins/purchase', 
      'POST', 
      req.body,
      { Authorization: req.headers.authorization }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Wallet service error' };
    res.status(status).json(message);
  }
});

app.post('/wallet/diamonds/convert', authenticateToken, [
  body('amount').isInt({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.wallet, 
      '/diamonds/convert', 
      'POST', 
      req.body,
      { Authorization: req.headers.authorization }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Wallet service error' };
    res.status(status).json(message);
  }
});

app.get('/wallet/transactions', authenticateToken, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.wallet, 
      '/transactions', 
      'GET',
      null,
      { Authorization: req.headers.authorization }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Wallet service error' };
    res.status(status).json(message);
  }
});

// Fraud Routes
app.get('/fraud/video/:videoId', authenticateToken, [
  param('videoId').isLength({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.fraud, 
      `/video/${req.params.videoId}`, 
      'GET',
      null,
      { Authorization: req.headers.authorization }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Fraud service error' };
    res.status(status).json(message);
  }
});

app.get('/fraud/user/:userId', authenticateToken, [
  param('userId').isLength({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.fraud, 
      `/user/${req.params.userId}`, 
      'GET',
      null,
      { Authorization: req.headers.authorization }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Fraud service error' };
    res.status(status).json(message);
  }
});

app.post('/fraud/review/:giftTxnId', authenticateToken, [
  param('giftTxnId').isLength({ min: 1 }),
  body('status').isIn(['valid', 'invalid'])
], handleValidationErrors, async (req, res) => {
  try {
    const response = await proxyToService(
      config.services.fraud, 
      `/review/${req.params.giftTxnId}`, 
      'POST', 
      req.body,
      { Authorization: req.headers.authorization }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Fraud service error' };
    res.status(status).json(message);
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

const server = app.listen(config.port, () => {
  console.log(`API Gateway running on port ${config.port}`);
  console.log('Service endpoints:', config.services);
});

module.exports = app;
