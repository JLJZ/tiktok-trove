import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { UserService } from '@/services/user.service';
import { ApiResponse } from '@/types/api.types';
import { AuthenticatedRequest } from '@/types/auth.types';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  public getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      const user = await this.userService.findById(id);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const response: ApiResponse<{
        id: string;
        username: string;
        displayName: string | null;
        bio: string | null;
        avatar?: string;
        createdAt: string;
      }> = {
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

    } catch (error) {
      logger.error('Get user profile error:', error);
      
      if (error instanceof AppError) {
        const response: ApiResponse<null> = {
          success: false,
          message: error.message,
        };
        res.status(error.statusCode).json(response);
        return;
      }

      const response: ApiResponse<null> = {
        success: false,
        message: 'Internal server error while fetching user profile',
      };
      res.status(500).json(response);
    }
  };

  public updateUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        };
        res.status(400).json(response);
        return;
      }

      const { id } = req.params;
      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      const { displayName, bio } = req.body;

      // Check if user is updating their own profile
      if (req.user?.id !== id) {
        throw new AppError('You can only update your own profile', 403);
      }

      // Check if user exists
      const existingUser = await this.userService.findById(id);
      if (!existingUser) {
        throw new AppError('User not found', 404);
      }

      // Update user profile
      const updatedUser = await this.userService.updateProfile(id, {
        displayName,
        bio,
      });

      const response: ApiResponse<{
        id: string;
        displayName: string | null;
        bio: string | null;
      }> = {
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: updatedUser.id,
          displayName: updatedUser.displayName,
          bio: updatedUser.bio,
        },
      };

      logger.info(`User profile updated: ${id}`);
      res.status(200).json(response);

    } catch (error) {
      logger.error('Update user profile error:', error);
      
      if (error instanceof AppError) {
        const response: ApiResponse<null> = {
          success: false,
          message: error.message,
        };
        res.status(error.statusCode).json(response);
        return;
      }

      const response: ApiResponse<null> = {
        success: false,
        message: 'Internal server error while updating profile',
      };
      res.status(500).json(response);
    }
  };

  public getUserStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      const user = await this.userService.findById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const stats = await this.userService.getUserStats(id);

      const response: ApiResponse<{
        loginCount: number;
        lastLoginAt: string | null;
        accountAge: number; // days
        isVerified: boolean;
      }> = {
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

    } catch (error) {
      logger.error('Get user stats error:', error);
      
      if (error instanceof AppError) {
        const response: ApiResponse<null> = {
          success: false,
          message: error.message,
        };
        res.status(error.statusCode).json(response);
        return;
      }

      const response: ApiResponse<null> = {
        success: false,
        message: 'Internal server error while fetching user stats',
      };
      res.status(500).json(response);
    }
  };

  public searchUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q, limit = '10', offset = '0' } = req.query;

      if (!q || typeof q !== 'string') {
        throw new AppError('Search query is required', 400);
      }

      const searchLimit = Math.min(parseInt(limit as string) || 10, 50); // Max 50 results
      const searchOffset = parseInt(offset as string) || 0;

      const results = await this.userService.searchUsers(q, {
        limit: searchLimit,
        offset: searchOffset,
      });

      const response: ApiResponse<{
        users: Array<{
          id: string;
          username: string;
          displayName: string | null;
          avatar?: string;
        }>;
        total: number;
        limit: number;
        offset: number;
      }> = {
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

    } catch (error) {
      logger.error('Search users error:', error);
      
      if (error instanceof AppError) {
        const response: ApiResponse<null> = {
          success: false,
          message: error.message,
        };
        res.status(error.statusCode).json(response);
        return;
      }

      const response: ApiResponse<null> = {
        success: false,
        message: 'Internal server error while searching users',
      };
      res.status(500).json(response);
    }
  };
}