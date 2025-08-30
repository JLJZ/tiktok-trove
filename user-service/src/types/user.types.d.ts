export interface UpdateProfileRequest {
    displayName?: string;
    bio?: string;
    avatar?: string;
}
export interface UserProfile {
    id: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    avatar: string | null;
    createdAt: Date;
    isVerified: boolean;
}
export interface UserSearchResult {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
}
export interface UserStats {
    loginCount: number;
    lastLoginAt: Date | null;
    accountAge: number;
    isVerified: boolean;
}
