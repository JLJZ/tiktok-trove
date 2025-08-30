import { Router, Request, Response } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const router: Router = Router();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'user-service',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: 'unknown',
      memory: 'unknown',
    },
  };

  try {
    // Database health check
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.checks.database = 'healthy';

    // Memory usage check
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };

    healthCheck.checks.memory = memUsageMB.heapUsed < 512 ? 'healthy' : 'warning';

    res.status(200).json({
      ...healthCheck,
      memory: memUsageMB,
    });

  } catch (error) {
    logger.error('Health check failed:', error);
    healthCheck.status = 'error';
    healthCheck.checks.database = 'unhealthy';
    
    res.status(503).json(healthCheck);
  }
});

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
  const detailedHealth = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'user-service',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {} as any,
    metrics: {} as any,
  };

  try {
    // Database connectivity and stats
    const dbStart = Date.now();
    const userCount = await prisma.user.count();
    const activeUserCount = await prisma.user.count({ where: { isActive: true } });
    const dbResponseTime = Date.now() - dbStart;

    detailedHealth.checks.database = {
      status: 'healthy',
      responseTime: `${dbResponseTime}ms`,
      userCount,
      activeUserCount,
    };

    // Memory metrics
    const memUsage = process.memoryUsage();
    detailedHealth.metrics.memory = {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    };

    // CPU usage (approximate)
    detailedHealth.metrics.cpu = {
      loadAverage: process.platform === 'win32' ? 'N/A' : require('os').loadavg(),
    };

    // Process metrics
    detailedHealth.metrics.process = {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };

    res.status(200).json(detailedHealth);

  } catch (error) {
    logger.error('Detailed health check failed:', error);
    detailedHealth.status = 'error';
    detailedHealth.checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    res.status(503).json(detailedHealth);
  }
});

// Liveness probe (for Kubernetes)
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe (for Kubernetes)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if we can connect to the database
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database connection failed',
    });
  }
});

export default router;