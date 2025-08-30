import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/types/auth.types';
export declare class UserController {
    private userService;
    constructor();
    getUserProfile: (req: Request, res: Response) => Promise<void>;
    updateUserProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    getUserStats: (req: Request, res: Response) => Promise<void>;
    searchUsers: (req: Request, res: Response) => Promise<void>;
}
