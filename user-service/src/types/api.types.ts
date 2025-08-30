import { ValidationError } from 'express-validator';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: any[];
  timestamp: string;
}