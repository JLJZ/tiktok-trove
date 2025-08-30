"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const express_validator_1 = require("express-validator");
const user_service_1 = require("@/services/user.service");
const logger_1 = require("@/utils/logger");
const errors_1 = require("@/utils/errors");
class UserController {
    userService;
    constructor() {
        this.userService = new user_service_1.UserService();
    }
    getUserProfile = async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errors_1.AppError('User ID is required', 400);
            }
            const user = await this.userService.findById(id);
            if (!user) {
                throw new errors_1.AppError('User not found', 404);
            }
            const response = {
                success: true,
                message: 'User profile retrieved successfully',
                data: {
                    id: user.id,
                    username: user.username,
                    displayName: user.displayName,
                    bio: user.bio,
                    avatar: user.avatar || undefined,
                    createdAt: user.createdAt.toISOString(),
                },
            };
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('Get user profile error:', error);
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
                message: 'Internal server error while fetching user profile',
            };
            res.status(500).json(response);
        }
    };
    updateUserProfile = async (req, res) => {
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
            const { id } = req.params;
            if (!id) {
                throw new errors_1.AppError('User ID is required', 400);
            }
            const { displayName, bio } = req.body;
            if (req.user?.id !== id) {
                throw new errors_1.AppError('You can only update your own profile', 403);
            }
            const existingUser = await this.userService.findById(id);
            if (!existingUser) {
                throw new errors_1.AppError('User not found', 404);
            }
            const updatedUser = await this.userService.updateProfile(id, {
                displayName,
                bio,
            });
            const response = {
                success: true,
                message: 'Profile updated successfully',
                data: {
                    id: updatedUser.id,
                    displayName: updatedUser.displayName,
                    bio: updatedUser.bio,
                },
            };
            logger_1.logger.info(`User profile updated: ${id}`);
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('Update user profile error:', error);
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
                message: 'Internal server error while updating profile',
            };
            res.status(500).json(response);
        }
    };
    getUserStats = async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errors_1.AppError('User ID is required', 400);
            }
            const user = await this.userService.findById(id);
            if (!user) {
                throw new errors_1.AppError('User not found', 404);
            }
            const stats = await this.userService.getUserStats(id);
            const response = {
                success: true,
                message: 'User stats retrieved successfully',
                data: {
                    loginCount: stats.loginCount,
                    lastLoginAt: stats.lastLoginAt?.toISOString() || null,
                    accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
                    isVerified: user.isVerified,
                },
            };
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('Get user stats error:', error);
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
                message: 'Internal server error while fetching user stats',
            };
            res.status(500).json(response);
        }
    };
    searchUsers = async (req, res) => {
        try {
            const { q, limit = '10', offset = '0' } = req.query;
            if (!q || typeof q !== 'string') {
                throw new errors_1.AppError('Search query is required', 400);
            }
            const searchLimit = Math.min(parseInt(limit) || 10, 50);
            const searchOffset = parseInt(offset) || 0;
            const results = await this.userService.searchUsers(q, {
                limit: searchLimit,
                offset: searchOffset,
            });
            const response = {
                success: true,
                message: 'User search completed successfully',
                data: {
                    users: results.users.map(user => ({
                        id: user.id,
                        username: user.username,
                        displayName: user.displayName,
                        avatar: user.avatar || undefined,
                    })),
                    total: results.total,
                    limit: searchLimit,
                    offset: searchOffset,
                },
            };
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('Search users error:', error);
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
                message: 'Internal server error while searching users',
            };
            res.status(500).json(response);
        }
    };
}
exports.UserController = UserController;
