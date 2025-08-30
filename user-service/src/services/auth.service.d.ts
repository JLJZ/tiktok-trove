import { User } from '@prisma/client';
import { RegisterRequest, LoginResponse, TokenPayload } from '@/types/auth.types';
export declare class AuthService {
    private readonly JWT_SECRET;
    private readonly JWT_EXPIRES_IN;
    private readonly REFRESH_TOKEN_EXPIRES_IN;
    private readonly SALT_ROUNDS;
    constructor();
    register(data: RegisterRequest): Promise<User>;
    login(email: string, password: string, metadata?: {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<LoginResponse>;
    refreshToken(refreshToken: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
    logout(token: string): Promise<void>;
    verifyToken(token: string): Promise<TokenPayload>;
    revokeToken(token: string): Promise<void>;
    revokeAllUserTokens(userId: string): Promise<void>;
    cleanupExpiredTokens(): Promise<void>;
    getUserSessions(userId: string): Promise<Array<{
        id: string;
        sessionId: string;
        ipAddress: string | null;
        userAgent: string | null;
        createdAt: Date;
        expiresAt: Date;
    }>>;
    terminateSession(userId: string, sessionId: string): Promise<void>;
    validatePasswordStrength(password: string): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    private generateAccessToken;
    private generateRefreshToken;
    private parseExpirationTime;
    private generateSessionId;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
    resetPassword(email: string): Promise<{
        resetToken: string;
    }>;
    confirmPasswordReset(resetToken: string, newPassword: string): Promise<void>;
    getTokenInfo(token: string): Promise<{
        isValid: boolean;
        payload?: TokenPayload;
        expiresAt?: Date;
        error?: string;
    }>;
}
