import { PrismaClient } from '@prisma/client';

// Singleton Prisma client, avoiding connection exhaustion during hot-reload.
// `process` is accessed via globalThis so this file needs no @types/node.
const g = globalThis as unknown as {
  prisma?: PrismaClient;
  process?: { env?: Record<string, string | undefined> };
};

const nodeEnv = g.process?.env?.NODE_ENV;

export const prisma =
  g.prisma ??
  new PrismaClient({
    log: nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
  });

if (nodeEnv !== 'production') {
  g.prisma = prisma;
}

export * from '@prisma/client';
