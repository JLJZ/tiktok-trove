"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateToken = void 0;
const auth_service_1 = require("@/services/auth.service");
const logger_1 = require("@/utils/logger");
const authService = new auth_service_1.AuthService();
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        if (!token) {
            const response = {
                success: false,
                message: 'Access token required',
            };
            res.status(401).json(response);
            return;
        }
        const decoded = await authService.verifyToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication middleware error:', error);
        const response = {
            success: false,
            message: 'Invalid or expired token',
        };
        res.status(403).json(response);
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        if (token) {
            try {
                const decoded = await authService.verifyToken(token);
                req.user = decoded;
            }
            catch (error) {
                logger_1.logger.debug('Optional auth failed, continuing without user context:', error);
            }
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Optional auth middleware error:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
