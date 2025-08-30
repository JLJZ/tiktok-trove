"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
async function main() {
    try {
        logger_1.logger.info('Starting database seeding...');
        const testUsers = [
            {
                username: 'john_doe',
                email: 'john@example.com',
                password: 'Password123!',
                displayName: 'John Doe',
                bio: 'Software developer and tech enthusiast',
                isVerified: true,
            },
            {
                username: 'jane_smith',
                email: 'jane@example.com',
                password: 'Password123!',
                displayName: 'Jane Smith',
                bio: 'Digital marketing specialist',
                isVerified: false,
            },
            {
                username: 'mike_wilson',
                email: 'mike@example.com',
                password: 'Password123!',
                displayName: 'Mike Wilson',
                bio: 'Photographer and content creator',
                isVerified: true,
            },
        ];
        for (const userData of testUsers) {
            const existingUser = await database_1.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: userData.email },
                        { username: userData.username },
                    ],
                },
            });
            if (existingUser) {
                logger_1.logger.info(`User ${userData.username} already exists, skipping...`);
                continue;
            }
            const hashedPassword = await bcrypt_1.default.hash(userData.password, 12);
            const user = await database_1.prisma.user.create({
                data: {
                    username: userData.username,
                    email: userData.email,
                    password: hashedPassword,
                    displayName: userData.displayName,
                    bio: userData.bio,
                    isVerified: userData.isVerified,
                },
            });
            logger_1.logger.info(`Created user: ${user.username} (${user.email})`);
        }
        logger_1.logger.info('Database seeding completed successfully!');
    }
    catch (error) {
        logger_1.logger.error('Database seeding failed:', error);
        process.exit(1);
    }
    finally {
        await database_1.prisma.$disconnect();
    }
}
main();
