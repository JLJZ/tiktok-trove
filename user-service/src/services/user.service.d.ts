import { User } from '@prisma/client';
import { UpdateProfileRequest } from '@/types/user.types';
export declare class UserService {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByEmailOrUsername(email: string, username: string): Promise<User | null>;
    updateProfile(id: string, data: UpdateProfileRequest): Promise<User>;
    getUserStats(id: string): Promise<{
        loginCount: number;
        lastLoginAt: Date | null;
    }>;
    searchUsers(query: string, options: {
        limit: number;
        offset: number;
    }): Promise<{
        users: Array<Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>>;
        total: number;
    }>;
    deactivateUser(id: string): Promise<void>;
    reactivateUser(id: string): Promise<void>;
    updateUserVerification(id: string, isVerified: boolean): Promise<void>;
    getUsersByIds(ids: string[]): Promise<User[]>;
    getUserCount(): Promise<number>;
    getRecentUsers(limit?: number): Promise<User[]>;
}
