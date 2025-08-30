import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import { Prisma } from '@/prisma/generated';

// Create Prisma client with logging configuration
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['info', 'warn', 'error'],
  errorFormat: 'minimal',
});

// Handle Prisma client errors
prisma.$on('error', (e: Prisma.LogEvent) => {
  logger.error('Prisma client error:', e);
});

// Connection event handlers
prisma.$connect()
  .then(() => {
    logger.info('Prisma client connected to database');
  })
  .catch((error: Error) => {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  });

// Graceful disconnect
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Prisma client disconnected from database');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
};