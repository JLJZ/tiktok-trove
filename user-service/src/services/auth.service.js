"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("@/config/database");
const errors_1 = require("@/utils/errors");
const logger_1 = require("@/utils/logger");
class AuthService {
    JWT_SECRET;
    JWT_EXPIRES_IN;
    REFRESH_TOKEN_EXPIRES_IN;
    SALT_ROUNDS = 12;
    constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
        this.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
        if (!process.env.JWT_SECRET) {
            logger_1.logger.warn('JWT_SECRET not set in environment variables, using default');
        }
    }
    async register(data) {
        try {
            const hashedPassword = await bcrypt_1.default.hash(data.password, this.SALT_ROUNDS);
            const user = await database_1.prisma.user.create({
                data: {
                    username: data.username,
                    email: data.email.toLowerCase(),
                    password: hashedPassword,
                    displayName: data.displayName || data.username,
                },
            });
            logger_1.logger.info(`New user registered: ${user.id}`);
            return user;
        }
        catch (error) {
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                if (target?.includes('email')) {
                    throw new errors_1.AppError('Email already exists', 409);
                }
                if (target?.includes('username')) {
                    throw new errors_1.AppError('Username already exists', 409);
                }
                throw new errors_1.AppError('User already exists', 409);
            }
            logger_1.logger.error('Registration error:', error);
            throw new errors_1.AppError('Registration failed', 500);
        }
    }
    async login(email, password, metadata) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { email: email.toLowerCase() },
            });
            if (!user) {
                throw new errors_1.AppError('Invalid credentials', 401);
            }
            if (!user.isActive) {
                throw new errors_1.AppError('Account is deactivated', 403);
            }
            const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                throw new errors_1.AppError('Invalid credentials', 401);
            }
            const token = this.generateAccessToken({
                id: user.id,
                email: user.email,
                username: user.username,
            });
            const refreshToken = await this.generateRefreshToken(user.id);
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLoginAt: new Date(),
                    loginCount: { increment: 1 },
                },
            });
            if (metadata) {
                await database_1.prisma.userSession.create({
                    data: {
                        userId: user.id,
                        sessionId: this.generateSessionId(),
                        ipAddress: metadata.ipAddress,
                        userAgent: metadata.userAgent,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    },
                });
            }
            return {
                token,
                refreshToken,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                },
            };
        }
        catch (error) {
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            logger_1.logger.error('Login error:', error);
            throw new errors_1.AppError('Login failed', 500);
        }
    }
    async refreshToken(refreshToken) {
        try {
            const tokenRecord = await database_1.prisma.refreshToken.findUnique({
                where: { token: refreshToken },
                include: { user: true },
            });
            if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
                throw new errors_1.AppError('Invalid or expired refresh token', 401);
            }
            const newAccessToken = this.generateAccessToken({
                id: tokenRecord.user.id,
                email: tokenRecord.user.email,
                username: tokenRecord.user.username,
            });
            const newRefreshToken = await this.generateRefreshToken(tokenRecord.user.id);
            await database_1.prisma.refreshToken.update({
                where: { id: tokenRecord.id },
                data: { isRevoked: true },
            });
            return {
                token: newAccessToken,
                refreshToken: newRefreshToken,
            };
        }
        catch (error) {
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            logger_1.logger.error('Token refresh error:', error);
            throw new errors_1.AppError('Token refresh failed', 500);
        }
    }
    async logout(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (decoded && decoded.id) {
                await database_1.prisma.refreshToken.updateMany({
                    where: {
                        userId: decoded.id,
                        isRevoked: false,
                    },
                    data: { isRevoked: true },
                });
                await database_1.prisma.userSession.deleteMany({
                    where: {
                        userId: decoded.id,
                        expiresAt: { lt: new Date() },
                    },
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Logout error:', error);
        }
    }
    async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
            const user = await database_1.prisma.user.findUnique({
                where: { id: decoded.id },
            });
            if (!user || !user.isActive) {
                throw new errors_1.AppError('Invalid token', 401);
            }
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errors_1.AppError('Invalid token', 401);
            }
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new errors_1.AppError('Token expired', 401);
            }
            throw error;
        }
    }
    async revokeToken(token) {
        try {
            await database_1.prisma.refreshToken.update({
                where: { token },
                data: { isRevoked: true },
            });
        }
        catch (error) {
            logger_1.logger.error('Revoke token error:', error);
        }
    }
    async revokeAllUserTokens(userId) {
        try {
            await database_1.prisma.refreshToken.updateMany({
                where: {
                    userId,
                    isRevoked: false,
                },
                data: { isRevoked: true },
            });
            await database_1.prisma.userSession.deleteMany({
                where: { userId },
            });
            logger_1.logger.info(`All tokens revoked for user: ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Revoke all user tokens error:', error);
            throw new errors_1.AppError('Failed to revoke tokens', 500);
        }
    }
    async cleanupExpiredTokens() {
        try {
            const now = new Date();
            const expiredTokens = await database_1.prisma.refreshToken.deleteMany({
                where: {
                    OR: [
                        { expiresAt: { lt: now } },
                        { isRevoked: true, createdAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
                    ],
                },
            });
            const expiredSessions = await database_1.prisma.userSession.deleteMany({
                where: { expiresAt: { lt: now } },
            });
            logger_1.logger.info(`Cleanup completed: ${expiredTokens.count} tokens, ${expiredSessions.count} sessions removed`);
        }
        catch (error) {
            logger_1.logger.error('Token cleanup error:', error);
            throw new errors_1.AppError('Token cleanup failed', 500);
        }
    }
    async getUserSessions(userId) {
        try {
            const sessions = await database_1.prisma.userSession.findMany({
                where: {
                    userId,
                    expiresAt: { gt: new Date() },
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    sessionId: true,
                    ipAddress: true,
                    userAgent: true,
                    createdAt: true,
                    expiresAt: true,
                },
            });
            return sessions;
        }
        catch (error) {
            logger_1.logger.error('Get user sessions error:', error);
            throw new errors_1.AppError('Failed to fetch user sessions', 500);
        }
    }
    async terminateSession(userId, sessionId) {
        try {
            await database_1.prisma.userSession.deleteMany({
                where: {
                    userId,
                    sessionId,
                },
            });
            logger_1.logger.info(`Session terminated: ${sessionId} for user: ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Terminate session error:', error);
            throw new errors_1.AppError('Failed to terminate session', 500);
        }
    }
    async validatePasswordStrength(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (password.length > 128) {
            errors.push('Password must not exceed 128 characters');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        const commonPasswords = [
            'password', '123456789', 'qwertyuiop', 'password123',
            'admin', 'letmein', 'welcome', 'monkey', 'dragon',
        ];
        if (commonPasswords.includes(password.toLowerCase())) {
            errors.push('Password is too common, please choose a more secure password');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRES_IN,
            issuer: 'user-service',
            audience: 'api-gateway',
            subject: payload.id,
        });
    }
    async generateRefreshToken(userId) {
        const token = jsonwebtoken_1.default.sign({
            userId,
            type: 'refresh',
            jti: `refresh_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        }, this.JWT_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
            issuer: 'user-service',
            audience: 'api-gateway',
            subject: userId,
        });
        const expiresAt = new Date();
        const expiresInMs = this.parseExpirationTime(this.REFRESH_TOKEN_EXPIRES_IN);
        expiresAt.setTime(expiresAt.getTime() + expiresInMs);
        await database_1.prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
        return token;
    }
    parseExpirationTime(timeString) {
        const timeValue = parseInt(timeString);
        const timeUnit = timeString.replace(timeValue.toString(), '');
        switch (timeUnit) {
            case 's': return timeValue * 1000;
            case 'm': return timeValue * 60 * 1000;
            case 'h': return timeValue * 60 * 60 * 1000;
            case 'd': return timeValue * 24 * 60 * 60 * 1000;
            case 'w': return timeValue * 7 * 24 * 60 * 60 * 1000;
            default: return 7 * 24 * 60 * 60 * 1000;
        }
    }
    generateSessionId() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async changePassword(userId, oldPassword, newPassword) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new errors_1.AppError('User not found', 404);
            }
            const isOldPasswordValid = await bcrypt_1.default.compare(oldPassword, user.password);
            if (!isOldPasswordValid) {
                throw new errors_1.AppError('Invalid current password', 400);
            }
            const passwordValidation = await this.validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                throw new errors_1.AppError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400);
            }
            const isSamePassword = await bcrypt_1.default.compare(newPassword, user.password);
            if (isSamePassword) {
                throw new errors_1.AppError('New password must be different from current password', 400);
            }
            const hashedNewPassword = await bcrypt_1.default.hash(newPassword, this.SALT_ROUNDS);
            await database_1.prisma.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword },
            });
            await this.revokeAllUserTokens(userId);
            logger_1.logger.info(`Password changed for user: ${userId}`);
        }
        catch (error) {
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            logger_1.logger.error('Change password error:', error);
            throw new errors_1.AppError('Failed to change password', 500);
        }
    }
    async resetPassword(email) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { email: email.toLowerCase() },
            });
            if (!user) {
                throw new errors_1.AppError('If the email exists, a reset link will be sent', 200);
            }
            const resetToken = jsonwebtoken_1.default.sign({
                userId: user.id,
                type: 'password_reset',
                email: user.email,
            }, this.JWT_SECRET, {
                expiresIn: '1h',
                issuer: 'user-service',
                audience: 'password-reset',
                subject: user.id,
            });
            logger_1.logger.info(`Password reset token generated for user: ${user.id}`);
            return { resetToken };
        }
        catch (error) {
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            logger_1.logger.error('Reset password error:', error);
            throw new errors_1.AppError('Failed to generate reset token', 500);
        }
    }
    async confirmPasswordReset(resetToken, newPassword) {
        try {
            const decoded = jsonwebtoken_1.default.verify(resetToken, this.JWT_SECRET);
            if (decoded.type !== 'password_reset') {
                throw new errors_1.AppError('Invalid reset token', 400);
            }
            const passwordValidation = await this.validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                throw new errors_1.AppError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400);
            }
            const user = await database_1.prisma.user.findUnique({
                where: { id: decoded.userId },
            });
            if (!user || user.email !== decoded.email) {
                throw new errors_1.AppError('Invalid reset token', 400);
            }
            const hashedPassword = await bcrypt_1.default.hash(newPassword, this.SALT_ROUNDS);
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            });
            await this.revokeAllUserTokens(user.id);
            logger_1.logger.info(`Password reset completed for user: ${user.id}`);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError || error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new errors_1.AppError('Invalid or expired reset token', 400);
            }
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            logger_1.logger.error('Confirm password reset error:', error);
            throw new errors_1.AppError('Failed to reset password', 500);
        }
    }
    async getTokenInfo(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
            return {
                isValid: true,
                payload: decoded,
                expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : undefined,
            };
        }
        catch (error) {
            let errorMessage = 'Unknown error';
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                errorMessage = 'Token expired';
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                errorMessage = 'Invalid token';
            }
            return {
                isValid: false,
                error: errorMessage,
            };
        }
    }
}
exports.AuthService = AuthService;
