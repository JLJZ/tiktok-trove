"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const errors_1 = require("@/utils/errors");
const logger_1 = require("@/utils/logger");
const errorHandler = (error, req, res, next) => {
    logger_1.logger.error('Global error handler:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    if (error instanceof errors_1.AppError) {
        const response = {
            success: false,
            message: error.message,
        };
        res.status(error.statusCode).json(response);
        return;
    }
    if (error.name === 'PrismaClientKnownRequestError') {
        const response = {
            success: false,
            message: 'Database operation failed',
        };
        res.status(500).json(response);
        return;
    }
    if (error.name === 'ValidationError') {
        const response = {
            success: false,
            message: 'Validation failed',
        };
        res.status(400).json(response);
        return;
    }
    if (error.name === 'JsonWebTokenError') {
        const response = {
            success: false,
            message: 'Invalid token',
        };
        res.status(401).json(response);
        return;
    }
    if (error.name === 'TokenExpiredError') {
        const response = {
            success: false,
            message: 'Token expired',
        };
        res.status(401).json(response);
        return;
    }
    if (error.name === 'UnhandledPromiseRejectionWarning') {
        logger_1.logger.error('Unhandled promise rejection:', error);
    }
    const response = {
        success: false,
        message: process.env.NODE_ENV === 'development'
            ? error.message
            : 'Internal server error',
    };
    res.status(500).json(response);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    const response = {
        success: false,
        message: 'Route not found',
        data: null,
    };
    logger_1.logger.warn('Route not found:', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    res.status(404).json(response);
};
exports.notFoundHandler = notFoundHandler;
