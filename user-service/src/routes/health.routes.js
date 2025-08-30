"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@/config/database");
const logger_1 = require("@/utils/logger");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
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
        await database_1.prisma.$queryRaw `SELECT 1`;
        healthCheck.checks.database = 'healthy';
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
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
        healthCheck.status = 'error';
        healthCheck.checks.database = 'unhealthy';
        res.status(503).json(healthCheck);
    }
});
router.get('/detailed', async (req, res) => {
    const detailedHealth = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'user-service',
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        checks: {},
        metrics: {},
    };
    try {
        const dbStart = Date.now();
        const userCount = await database_1.prisma.user.count();
        const activeUserCount = await database_1.prisma.user.count({ where: { isActive: true } });
        const dbResponseTime = Date.now() - dbStart;
        detailedHealth.checks.database = {
            status: 'healthy',
            responseTime: `${dbResponseTime}ms`,
            userCount,
            activeUserCount,
        };
        const memUsage = process.memoryUsage();
        detailedHealth.metrics.memory = {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        };
        detailedHealth.metrics.cpu = {
            loadAverage: process.platform === 'win32' ? 'N/A' : require('os').loadavg(),
        };
        detailedHealth.metrics.process = {
            pid: process.pid,
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
        };
        res.status(200).json(detailedHealth);
    }
    catch (error) {
        logger_1.logger.error('Detailed health check failed:', error);
        detailedHealth.status = 'error';
        detailedHealth.checks.database = {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
        res.status(503).json(detailedHealth);
    }
});
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
    });
});
router.get('/ready', async (req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Readiness check failed:', error);
        res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Database connection failed',
        });
    }
});
exports.default = router;
