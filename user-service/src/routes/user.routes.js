"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const user_controller_1 = require("@/controllers/user.controller");
const auth_middleware_1 = require("@/middleware/auth.middleware");
const router = (0, express_1.Router)();
const userController = new user_controller_1.UserController();
const userIdValidation = [
    (0, express_validator_1.param)('id')
        .isLength({ min: 1 })
        .withMessage('User ID is required'),
];
const updateProfileValidation = [
    ...userIdValidation,
    (0, express_validator_1.body)('displayName')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Display name cannot exceed 100 characters'),
    (0, express_validator_1.body)('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters'),
];
const searchUsersValidation = [
    (0, express_validator_1.query)('q')
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be 1-100 characters long'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    (0, express_validator_1.query)('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be a non-negative integer'),
];
router.get('/search', searchUsersValidation, userController.searchUsers);
router.get('/:id', userIdValidation, userController.getUserProfile);
router.get('/:id/stats', userIdValidation, userController.getUserStats);
router.put('/:id', auth_middleware_1.authenticateToken, updateProfileValidation, userController.updateUserProfile);
exports.default = router;
