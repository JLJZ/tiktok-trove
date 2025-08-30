"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("@/utils/logger");
exports.prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['info', 'warn', 'error'],
    errorFormat: 'minimal',
});
exports.prisma.$on('error', (e) => {
    logger_1.logger.error('Prisma client error:', e);
});
exports.prisma.$connect()
    .then(() => {
    logger_1.logger.info('Prisma client connected to database');
})
    .catch((error) => {
    logger_1.logger.error('Failed to connect to database:', error);
    process.exit(1);
});
const disconnectDatabase = async () => {
    try {
        await exports.prisma.$disconnect();
        logger_1.logger.info('Prisma client disconnected from database');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from database:', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
