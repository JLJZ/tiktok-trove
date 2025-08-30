import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types/api.types';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

// Global error handler
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Global error handler:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle known application errors
  if (error instanceof AppError) {
    const response: ApiResponse<null> = {
      success: false,
      message: error.message,
    };
    res.status(error.statusCode).json(response);
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const response: ApiResponse<null> = {
      success: false,
      message: 'Database operation failed',
    };
    res.status(500).json(response);
    return;
  }

  // Handle validation errors from express-validator
  if (error.name === 'ValidationError') {
    const response: ApiResponse<null> = {
      success: false,
      message: 'Validation failed',
    };
    res.status(400).json(response);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const response: ApiResponse<null> = {
      success: false,
      message: 'Invalid token',
    };
    res.status(401).json(response);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const response: ApiResponse<null> = {
      success: false,
      message: 'Token expired',
    };
    res.status(401).json(response);
    return;
  }

  // Handle async errors
  if (error.name === 'UnhandledPromiseRejectionWarning') {
    logger.error('Unhandled promise rejection:', error);
  }

  // Default error response
  const response: ApiResponse<null> = {
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error',
  };

  res.status(500).json(response);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse<null> = {
    success: false,
    message: 'Route not found',
    data: null,
  };

  logger.warn('Route not found:', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json(response);
};