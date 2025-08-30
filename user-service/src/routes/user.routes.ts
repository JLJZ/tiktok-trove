import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { UserController } from '@/controllers/user.controller';
import { authenticateToken } from '@/middleware/auth.middleware';

const router: Router = Router();
const userController = new UserController();

// Validation rules
const userIdValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('User ID is required'),
];

const updateProfileValidation = [
  ...userIdValidation,
  body('displayName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Display name cannot exceed 100 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
];

const searchUsersValidation = [
  query('q')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be 1-100 characters long'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
];

// Routes
router.get('/search', searchUsersValidation, userController.searchUsers);
router.get('/:id', userIdValidation, userController.getUserProfile);
router.get('/:id/stats', userIdValidation, userController.getUserStats);
router.put('/:id', authenticateToken, updateProfileValidation, userController.updateUserProfile);

export default router;