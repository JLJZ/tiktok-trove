"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const express_validator_1 = require("express-validator");
const auth_service_1 = require("@/services/auth.service");
const user_service_1 = require("@/services/user.service");
const logger_1 = require("@/utils/logger");
const errors_1 = require("@/utils/errors");
class AuthController {
    authService;
    userService;
    constructor() {
        this.authService = new auth_service_1.AuthService();
        this.userService = new user_service_1.UserService();
    }
    register = async (req, res) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                const response = {
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                };
                res.status(400).json(response);
                return;
            }
            const { username, email, password } = req.body;
            const existingUser = await this.userService.findByEmailOrUsername(email, username);
            if (existingUser) {
                throw new errors_1.AppError('User with this email or username already exists', 409);
            }
            const user = await this.authService.register({
                username,
                email,
                password,
            });
            const response = {
                success: true,
                message: 'User registered successfully',
                data: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            };
            logger_1.logger.info(`User registered: ${user.id} (${user.email})`);
            res.status(201).json(response);
        }
        catch (error) {
            logger_1.logger.error('Registration error:', error);
            if (error instanceof errors_1.AppError) {
                const response = {
                    success: false,
                    message: error.message,
                };
                res.status(error.statusCode).json(response);
                return;
            }
            const response = {
                success: false,
                message: 'Internal server error during registration',
            };
            res.status(500).json(response);
        }
    };
    login = async (req, res) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                const response = {
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                };
                res.status(400).json(response);
                return;
            }
            const { email, password } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
            const userAgent = req.get('User-Agent') || 'unknown';
            const result = await this.authService.login(email, password, {
                ipAddress,
                userAgent,
            });
            const response = {
                success: true,
                message: 'Login successful',
                data: {
                    token: result.token,
                    user: {
                        id: result.user.id,
                        username: result.user.username,
                        email: result.user.email,
                        displayName: result.user.displayName || undefined,
                    },
                },
            };
            logger_1.logger.info(`User logged in: ${result.user.id} (${result.user.email})`);
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            if (error instanceof errors_1.AppError) {
                const response = {
                    success: false,
                    message: error.message,
                };
                res.status(error.statusCode).json(response);
                return;
            }
            const response = {
                success: false,
                message: 'Internal server error during login',
            };
            res.status(500).json(response);
        }
    };
    refreshToken = async (req, res) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new errors_1.AppError('Refresh token is required', 400);
            }
            const result = await this.authService.refreshToken(refreshToken);
            const response = {
                success: true,
                message: 'Token refreshed successfully',
                data: result,
            };
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('Token refresh error:', error);
            if (error instanceof errors_1.AppError) {
                const response = {
                    success: false,
                    message: error.message,
                };
                res.status(error.statusCode).json(response);
                return;
            }
            const response = {
                success: false,
                message: 'Internal server error during token refresh',
            };
            res.status(500).json(response);
        }
    };
    logout = async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader?.split(' ')[1];
            if (token) {
                await this.authService.logout(token);
            }
            const response = {
                success: true,
                message: 'Logged out successfully',
            };
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('Logout error:', error);
            const response = {
                success: false,
                message: 'Error during logout',
            };
            res.status(500).json(response);
        }
    };
}
exports.AuthController = AuthController;
