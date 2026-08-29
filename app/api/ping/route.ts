import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbStatus = 'unknown';
  let userCount = 0;
  let adminEmail = '';

  try {
    userCount = await prisma.user.count();
    const admin = await prisma.user.findFirst({ where: { email: 'admin@community.vip' } });
    adminEmail = admin?.email || 'not found';
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  return NextResponse.json({
    status: 'ok',
    message: 'Pong! Next.js is responding cleanly on dezirclab.click.',
    timestamp: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    env: {
      databaseUrl: process.env.DATABASE_URL,
      hasSessionSecret: Boolean(process.env.SESSION_SECRET),
    },
    database: {
      status: dbStatus,
      totalUsers: userCount,
      adminEmail,
    },
  });
}
