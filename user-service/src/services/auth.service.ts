import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { prisma } from '@/config/database';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { 
  RegisterRequest, 
  LoginRequest, 
  LoginResponse,
  TokenPayload 
} from '@/types/auth.types';

export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly REFRESH_TOKEN_EXPIRES_IN: string;
  private readonly SALT_ROUNDS = 12;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
    this.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

    if (!process.env.JWT_SECRET) {
      logger.warn('JWT_SECRET not set in environment variables, using default');
    }
  }

  public async register(data: RegisterRequest): Promise<User> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          username: data.username,
          email: data.email.toLowerCase(),
          password: hashedPassword,
          displayName: data.displayName || data.username,
        },
      });

      logger.info(`New user registered: ${user.id}`);
      return user;

    } catch (error: any) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        const target = error.meta?.target;
        if (target?.includes('email')) {
          throw new AppError('Email already exists', 409);
        }
        if (target?.includes('username')) {
          throw new AppError('Username already exists', 409);
        }
        throw new AppError('User already exists', 409);
      }
      logger.error('Registration error:', error);
      throw new AppError('Registration failed', 500);
    }
  }

  public async login(
    email: string, 
    password: string, 
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<LoginResponse> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      if (!user.isActive) {
        throw new AppError('Account is deactivated', 403);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Generate tokens
      const token = this.generateAccessToken({
        id: user.id,
        email: user.email,
        username: user.username,
      });

      const refreshToken = await this.generateRefreshToken(user.id);

      // Update login stats
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 },
        },
      });

      // Create session record
      if (metadata) {
        await prisma.userSession.create({
          data: {
            userId: user.id,
            sessionId: this.generateSessionId(),
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
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

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Login error:', error);
      throw new AppError('Login failed', 500);
    }
  }

  public async refreshToken(refreshToken: string): Promise<{
    token: string;
    refreshToken: string;
  }> {
    try {
      // Find and validate refresh token
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken({
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        username: tokenRecord.user.username,
      });

      const newRefreshToken = await this.generateRefreshToken(tokenRecord.user.id);

      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true },
      });

      return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Token refresh error:', error);
      throw new AppError('Token refresh failed', 500);
    }
  }

  public async logout(token: string): Promise<void> {
    try {
      // Decode token to get user info (without verification since we just need user ID)
      const decoded = jwt.decode(token) as TokenPayload;
      
      if (decoded && decoded.id) {
        // Revoke all refresh tokens for this user
        await prisma.refreshToken.updateMany({
          where: { 
            userId: decoded.id,
            isRevoked: false,
          },
          data: { isRevoked: true },
        });

        // Clean up expired sessions
        await prisma.userSession.deleteMany({
          where: {
            userId: decoded.id,
            expiresAt: { lt: new Date() },
          },
        });
      }

    } catch (error) {
      logger.error('Logout error:', error);
      // Don't throw error for logout - it should always succeed from user perspective
    }
  }

  public async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      
      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || !user.isActive) {
        throw new AppError('Invalid token', 401);
      }

      return decoded;

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401);
      }
      throw error;
    }
  }

  public async revokeToken(token: string): Promise<void> {
    try {
      await prisma.refreshToken.update({
        where: { token },
        data: { isRevoked: true },
      });

    } catch (error) {
      logger.error('Revoke token error:', error);
      // Don't throw error - revocation should be idempotent
    }
  }

  public async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      await prisma.refreshToken.updateMany({
        where: { 
          userId,
          isRevoked: false,
        },
        data: { isRevoked: true },
      });

      await prisma.userSession.deleteMany({
        where: { userId },
      });

      logger.info(`All tokens revoked for user: ${userId}`);

    } catch (error) {
      logger.error('Revoke all user tokens error:', error);
      throw new AppError('Failed to revoke tokens', 500);
    }
  }

  public async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      
      // Remove expired refresh tokens
      const expiredTokens = await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { isRevoked: true, createdAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }, // Revoked tokens older than 7 days
          ],
        },
      });

      // Remove expired sessions
      const expiredSessions = await prisma.userSession.deleteMany({
        where: { expiresAt: { lt: now } },
      });

      logger.info(`Cleanup completed: ${expiredTokens.count} tokens, ${expiredSessions.count} sessions removed`);

    } catch (error) {
      logger.error('Token cleanup error:', error);
      throw new AppError('Token cleanup failed', 500);
    }
  }

  public async getUserSessions(userId: string): Promise<Array<{
    id: string;
    sessionId: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    expiresAt: Date;
  }>> {
    try {
      const sessions = await prisma.userSession.findMany({
        where: { 
          userId,
          expiresAt: { gt: new Date() }, // Only active sessions
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

    } catch (error) {
      logger.error('Get user sessions error:', error);
      throw new AppError('Failed to fetch user sessions', 500);
    }
  }

  public async terminateSession(userId: string, sessionId: string): Promise<void> {
    try {
      await prisma.userSession.deleteMany({
        where: { 
          userId,
          sessionId,
        },
      });

      logger.info(`Session terminated: ${sessionId} for user: ${userId}`);

    } catch (error) {
      logger.error('Terminate session error:', error);
      throw new AppError('Failed to terminate session', 500);
    }
  }

  public async validatePasswordStrength(password: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

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

    // Check for common passwords
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

  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: 'user-service',
      audience: 'api-gateway',
      subject: payload.id,
    } as jwt.SignOptions);
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = jwt.sign(
      { 
        userId, 
        type: 'refresh',
        jti: `refresh_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      },
      this.JWT_SECRET,
      { 
        expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
        issuer: 'user-service',
        audience: 'api-gateway',
        subject: userId,
      } as jwt.SignOptions
    );

    // Calculate expiration date
    const expiresAt = new Date();
    const expiresInMs = this.parseExpirationTime(this.REFRESH_TOKEN_EXPIRES_IN);
    expiresAt.setTime(expiresAt.getTime() + expiresInMs);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  private parseExpirationTime(timeString: string): number {
    const timeValue = parseInt(timeString);
    const timeUnit = timeString.replace(timeValue.toString(), '');

    switch (timeUnit) {
      case 's': return timeValue * 1000;
      case 'm': return timeValue * 60 * 1000;
      case 'h': return timeValue * 60 * 60 * 1000;
      case 'd': return timeValue * 24 * 60 * 60 * 1000;
      case 'w': return timeValue * 7 * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    }
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async changePassword(
    userId: string, 
    oldPassword: string, 
    newPassword: string
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify old password
      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isOldPasswordValid) {
        throw new AppError('Invalid current password', 400);
      }

      // Validate new password strength
      const passwordValidation = await this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400);
      }

      // Check if new password is different from old password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new AppError('New password must be different from current password', 400);
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      // Revoke all refresh tokens to force re-login
      await this.revokeAllUserTokens(userId);

      logger.info(`Password changed for user: ${userId}`);

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Change password error:', error);
      throw new AppError('Failed to change password', 500);
    }
  }

  public async resetPassword(email: string): Promise<{ resetToken: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Don't reveal if email exists for security reasons
        throw new AppError('If the email exists, a reset link will be sent', 200);
      }

      // Generate password reset token (expires in 1 hour)
      const resetToken = jwt.sign(
        { 
          userId: user.id, 
          type: 'password_reset',
          email: user.email,
        },
        this.JWT_SECRET,
        { 
          expiresIn: '1h',
          issuer: 'user-service',
          audience: 'password-reset',
          subject: user.id,
        }
      );

      logger.info(`Password reset token generated for user: ${user.id}`);

      return { resetToken };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Reset password error:', error);
      throw new AppError('Failed to generate reset token', 500);
    }
  }

  public async confirmPasswordReset(resetToken: string, newPassword: string): Promise<void> {
    try {
      // Verify reset token
      const decoded = jwt.verify(resetToken, this.JWT_SECRET) as any;
      
      if (decoded.type !== 'password_reset') {
        throw new AppError('Invalid reset token', 400);
      }

      // Validate new password
      const passwordValidation = await this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400);
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.email !== decoded.email) {
        throw new AppError('Invalid reset token', 400);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Revoke all tokens
      await this.revokeAllUserTokens(user.id);

      logger.info(`Password reset completed for user: ${user.id}`);

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        throw new AppError('Invalid or expired reset token', 400);
      }
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Confirm password reset error:', error);
      throw new AppError('Failed to reset password', 500);
    }
  }

  public async getTokenInfo(token: string): Promise<{
    isValid: boolean;
    payload?: TokenPayload;
    expiresAt?: Date;
    error?: string;
  }> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      
      return {
        isValid: true,
        payload: decoded,
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : undefined,
      };

    } catch (error) {
      let errorMessage = 'Unknown error';
      
      if (error instanceof jwt.TokenExpiredError) {
        errorMessage = 'Token expired';
      } else if (error instanceof jwt.JsonWebTokenError) {
        errorMessage = 'Invalid token';
      }

      return {
        isValid: false,
        error: errorMessage,
      };
    }
  }
}