import { User } from '@prisma/client';
import { prisma } from '@/config/database';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { UpdateProfileRequest } from '@/types/user.types';

export class UserService {
  public async findById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Find user by ID error:', error);
      throw new AppError('Failed to fetch user', 500);
    }
  }

  public async findByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
    } catch (error) {
      logger.error('Find user by email error:', error);
      throw new AppError('Failed to fetch user', 500);
    }
  }

  public async findByUsername(username: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { username },
      });
    } catch (error) {
      logger.error('Find user by username error:', error);
      throw new AppError('Failed to fetch user', 500);
    }
  }

  public async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    try {
      return await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { username },
          ],
        },
      });
    } catch (error) {
      logger.error('Find user by email or username error:', error);
      throw new AppError('Failed to fetch user', 500);
    }
  }

  public async updateProfile(id: string, data: UpdateProfileRequest): Promise<User> {
    try {
      const updateData: Partial<User> = {};

      if (data.displayName !== undefined) {
        updateData.displayName = data.displayName || null;
      }

      if (data.bio !== undefined) {
        updateData.bio = data.bio || null;
      }

      if (data.avatar !== undefined) {
        updateData.avatar = data.avatar || null;
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      logger.info(`User profile updated: ${id}`);
      return user;

    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('User not found', 404);
      }
      logger.error('Update user profile error:', error);
      throw new AppError('Failed to update profile', 500);
    }
  }

  public async getUserStats(id: string): Promise<{
    loginCount: number;
    lastLoginAt: Date | null;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          loginCount: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return {
        loginCount: user.loginCount,
        lastLoginAt: user.lastLoginAt,
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Get user stats error:', error);
      throw new AppError('Failed to fetch user stats', 500);
    }
  }

  public async searchUsers(
    query: string, 
    options: { limit: number; offset: number }
  ): Promise<{
    users: Array<Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>>;
    total: number;
  }> {
    try {
      const searchQuery = `%${query.toLowerCase()}%`;

      // Get total count
      const total = await prisma.user.count({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
        },
      });

      // Get users
      const users = await prisma.user.findMany({
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

    } catch (error) {
      logger.error('Search users error:', error);
      throw new AppError('Failed to search users', 500);
    }
  }

  public async deactivateUser(id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      // Revoke all refresh tokens
      await prisma.refreshToken.updateMany({
        where: { userId: id },
        data: { isRevoked: true },
      });

      // Delete all sessions
      await prisma.userSession.deleteMany({
        where: { userId: id },
      });

      logger.info(`User deactivated: ${id}`);

    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('User not found', 404);
      }
      logger.error('Deactivate user error:', error);
      throw new AppError('Failed to deactivate user', 500);
    }
  }

  public async reactivateUser(id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: { isActive: true },
      });

      logger.info(`User reactivated: ${id}`);

    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('User not found', 404);
      }
      logger.error('Reactivate user error:', error);
      throw new AppError('Failed to reactivate user', 500);
    }
  }

  public async updateUserVerification(id: string, isVerified: boolean): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: { isVerified },
      });

      logger.info(`User verification updated: ${id} - ${isVerified}`);

    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('User not found', 404);
      }
      logger.error('Update user verification error:', error);
      throw new AppError('Failed to update user verification', 500);
    }
  }

  public async getUsersByIds(ids: string[]): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        where: {
          id: { in: ids },
          isActive: true,
        },
      });
    } catch (error) {
      logger.error('Get users by IDs error:', error);
      throw new AppError('Failed to fetch users', 500);
    }
  }

  public async getUserCount(): Promise<number> {
    try {
      return await prisma.user.count({
        where: { isActive: true },
      });
    } catch (error) {
      logger.error('Get user count error:', error);
      throw new AppError('Failed to get user count', 500);
    }
  }

  public async getRecentUsers(limit = 10): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('Get recent users error:', error);
      throw new AppError('Failed to fetch recent users', 500);
    }
  }
}