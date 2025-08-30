import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '@/services/auth.service';
import { UserService } from '@/services/user.service';
import { ApiResponse } from '@/types/api.types';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';

export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  public register = async (req: Request, res: Response): Promise<void> => {
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

      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await this.userService.findByEmailOrUsername(email, username);
      if (existingUser) {
        throw new AppError('User with this email or username already exists', 409);
      }

      // Register new user
      const user = await this.authService.register({
        username,
        email,
        password,
      });

      const response: ApiResponse<{
        id: string;
        username: string;
        email: string;
      }> = {
        success: true,
        message: 'User registered successfully',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      };

      logger.info(`User registered: ${user.id} (${user.email})`);
      res.status(201).json(response);

    } catch (error) {
      logger.error('Registration error:', error);
      
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
        message: 'Internal server error during registration',
      };
      res.status(500).json(response);
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
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

      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      // Authenticate user
      const result = await this.authService.login(email, password, {
        ipAddress,
        userAgent,
      });

      const response: ApiResponse<{
        token: string;
        user?: {
          id: string;
          username: string;
          email: string;
          displayName?: string;
        };
      }> = {
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

      logger.info(`User logged in: ${result.user.id} (${result.user.email})`);
      res.status(200).json(response);

    } catch (error) {
      logger.error('Login error:', error);
      
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
        message: 'Internal server error during login',
      };
      res.status(500).json(response);
    }
  };

  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      const result = await this.authService.refreshToken(refreshToken);

      const response: ApiResponse<{
        token: string;
        refreshToken: string;
      }> = {
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Token refresh error:', error);
      
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
        message: 'Internal server error during token refresh',
      };
      res.status(500).json(response);
    }
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (token) {
        await this.authService.logout(token);
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Logged out successfully',
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Logout error:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        message: 'Error during logout',
      };
      res.status(500).json(response);
    }
  };
}