const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

let prisma;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    });

    // Connection event handlers
    prisma.$connect()
      .then(() => {
        logger.info('✅ Successfully connected to Supabase database');
      })
      .catch((error) => {
        logger.error('❌ Failed to connect to database:', error);
        process.exit(1);
      });
  }

  return prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('🔌 Disconnected from database');
  }
});

module.exports = { prisma: getPrismaClient() };
