import { Response, NextFunction } from 'express';
import { AuthService } from '@/services/auth.service';
import { AuthenticatedRequest } from '@/types/auth.types';
import { ApiResponse } from '@/types/api.types';
import { logger } from '@/utils/logger';

const authService = new AuthService();

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Access token required',
      };
      res.status(401).json(response);
      return;
    }

    // Verify and decode token
    const decoded = await authService.verifyToken(token);
    req.user = decoded;
    
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      message: 'Invalid or expired token',
    };
    res.status(403).json(response);
  }
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      try {
        const decoded = await authService.verifyToken(token);
        req.user = decoded;
      } catch (error) {
        // Token is invalid but we continue without user context
        logger.debug('Optional auth failed, continuing without user context:', error);
      }
    }
    
    next();
  } catch (error) {
    // This should never happen but just in case
    logger.error('Optional auth middleware error:', error);
    next();
  }
};