import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

async function main() {
  try {
    logger.info('Starting database seeding...');

    // Create test users
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
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { username: userData.username },
          ],
        },
      });

      if (existingUser) {
        logger.info(`User ${userData.username} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          displayName: userData.displayName,
          bio: userData.bio,
          isVerified: userData.isVerified,
        },
      });

      logger.info(`Created user: ${user.username} (${user.email})`);
    }

    logger.info('Database seeding completed successfully!');

  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();