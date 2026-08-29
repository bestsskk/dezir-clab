import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

declare global {
  var __prisma: PrismaClient | undefined;
}

function resolveDatabaseUrl(): string {
  const candidates = [
    path.join(process.cwd(), 'prisma', 'dev.db'),
    path.join(process.cwd(), 'dev.db'),
    path.join(process.cwd(), '..', 'prisma', 'dev.db'),
    path.join(process.cwd(), '..', 'dev.db'),
    path.join(__dirname, 'prisma', 'dev.db'),
    path.join(__dirname, 'dev.db'),
    path.resolve(process.cwd(), 'prisma/dev.db'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return `file:${candidate}`;
    }
  }

  return 'file:./prisma/dev.db';
}

function createPrismaClient(): PrismaClient {
  const dbUrl = resolveDatabaseUrl();
  process.env.DATABASE_URL = dbUrl;

  return new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export default prisma;




