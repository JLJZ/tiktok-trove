import { Request } from 'express';
export interface TokenPayload {
    id: string;
    email: string;
    username: string;
    iat?: number;
    exp?: number;
}
export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    displayName?: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    token: string;
    refreshToken: string;
    user: {
        id: string;
        username: string;
        email: string;
        displayName: string | null;
    };
}
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}
