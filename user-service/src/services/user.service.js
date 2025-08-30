"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const database_1 = require("@/config/database");
const errors_1 = require("@/utils/errors");
const logger_1 = require("@/utils/logger");
class UserService {
    async findById(id) {
        try {
            return await database_1.prisma.user.findUnique({
                where: { id },
            });
        }
        catch (error) {
            logger_1.logger.error('Find user by ID error:', error);
            throw new errors_1.AppError('Failed to fetch user', 500);
        }
    }
    async findByEmail(email) {
        try {
            return await database_1.prisma.user.findUnique({
                where: { email: email.toLowerCase() },
            });
        }
        catch (error) {
            logger_1.logger.error('Find user by email error:', error);
            throw new errors_1.AppError('Failed to fetch user', 500);
        }
    }
    async findByUsername(username) {
        try {
            return await database_1.prisma.user.findUnique({
                where: { username },
            });
        }
        catch (error) {
            logger_1.logger.error('Find user by username error:', error);
            throw new errors_1.AppError('Failed to fetch user', 500);
        }
    }
    async findByEmailOrUsername(email, username) {
        try {
            return await database_1.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: email.toLowerCase() },
                        { username },
                    ],
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Find user by email or username error:', error);
            throw new errors_1.AppError('Failed to fetch user', 500);
        }
    }
    async updateProfile(id, data) {
        try {
            const updateData = {};
            if (data.displayName !== undefined) {
                updateData.displayName = data.displayName || null;
            }
            if (data.bio !== undefined) {
                updateData.bio = data.bio || null;
            }
            if (data.avatar !== undefined) {
                updateData.avatar = data.avatar || null;
            }
            const user = await database_1.prisma.user.update({
                where: { id },
                data: updateData,
            });
            logger_1.logger.info(`User profile updated: ${id}`);
            return user;
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new errors_1.AppError('User not found', 404);
            }
            logger_1.logger.error('Update user profile error:', error);
            throw new errors_1.AppError('Failed to update profile', 500);
        }
    }
    async getUserStats(id) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id },
                select: {
                    loginCount: true,
                    lastLoginAt: true,
                },
            });
            if (!user) {
                throw new errors_1.AppError('User not found', 404);
            }
            return {
                loginCount: user.loginCount,
                lastLoginAt: user.lastLoginAt,
            };
        }
        catch (error) {
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            logger_1.logger.error('Get user stats error:', error);
            throw new errors_1.AppError('Failed to fetch user stats', 500);
        }
    }
    async searchUsers(query, options) {
        try {
            const searchQuery = `%${query.toLowerCase()}%`;
            const total = await database_1.prisma.user.count({
                where: {
                    OR: [
                        { username: { contains: query, mode: 'insensitive' } },
                        { displayName: { contains: query, mode: 'insensitive' } },
                    ],
                    isActive: true,
                },
            });
            const users = await database_1.prisma.user.findMany({
                where: {
                    OR: [
                        { username: { contains: query, mode: 'insensitive' } },
                        { displayName: { contains: query, mode: 'insensitive' } },
                    ],
                    isActive: true,
                },
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                },
                orderBy: [
                    {
                        username: 'asc',
                    },
                ],
                skip: options.offset,
                take: options.limit,
            });
            return { users, total };
        }
        catch (error) {
            logger_1.logger.error('Search users error:', error);
            throw new errors_1.AppError('Failed to search users', 500);
        }
    }
    async deactivateUser(id) {
        try {
            await database_1.prisma.user.update({
                where: { id },
                data: { isActive: false },
            });
            await database_1.prisma.refreshToken.updateMany({
                where: { userId: id },
                data: { isRevoked: true },
            });
            await database_1.prisma.userSession.deleteMany({
                where: { userId: id },
            });
            logger_1.logger.info(`User deactivated: ${id}`);
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new errors_1.AppError('User not found', 404);
            }
            logger_1.logger.error('Deactivate user error:', error);
            throw new errors_1.AppError('Failed to deactivate user', 500);
        }
    }
    async reactivateUser(id) {
        try {
            await database_1.prisma.user.update({
                where: { id },
                data: { isActive: true },
            });
            logger_1.logger.info(`User reactivated: ${id}`);
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new errors_1.AppError('User not found', 404);
            }
            logger_1.logger.error('Reactivate user error:', error);
            throw new errors_1.AppError('Failed to reactivate user', 500);
        }
    }
    async updateUserVerification(id, isVerified) {
        try {
            await database_1.prisma.user.update({
                where: { id },
                data: { isVerified },
            });
            logger_1.logger.info(`User verification updated: ${id} - ${isVerified}`);
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new errors_1.AppError('User not found', 404);
            }
            logger_1.logger.error('Update user verification error:', error);
            throw new errors_1.AppError('Failed to update user verification', 500);
        }
    }
    async getUsersByIds(ids) {
        try {
            return await database_1.prisma.user.findMany({
                where: {
                    id: { in: ids },
                    isActive: true,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Get users by IDs error:', error);
            throw new errors_1.AppError('Failed to fetch users', 500);
        }
    }
    async getUserCount() {
        try {
            return await database_1.prisma.user.count({
                where: { isActive: true },
            });
        }
        catch (error) {
            logger_1.logger.error('Get user count error:', error);
            throw new errors_1.AppError('Failed to get user count', 500);
        }
    }
    async getRecentUsers(limit = 10) {
        try {
            return await database_1.prisma.user.findMany({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
        }
        catch (error) {
            logger_1.logger.error('Get recent users error:', error);
            throw new errors_1.AppError('Failed to fetch recent users', 500);
        }
    }
}
exports.UserService = UserService;
