import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasDirectUrl: Boolean(process.env.DIRECT_URL),
      hasSessionSecret: Boolean(process.env.SESSION_SECRET),
      nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
    },
    database: {
      status: 'pending',
      error: null,
      adminUser: null,
      totalUsers: 0,
    },
  };

  try {
    const userCount = await prisma.user.count();
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@community.vip' },
      select: { id: true, email: true, role: true, status: true, lastLoginAt: true },
    });

    diagnostics.database.status = 'connected';
    diagnostics.database.totalUsers = userCount;
    diagnostics.database.adminUser = admin;

    return NextResponse.json({ success: true, diagnostics }, { status: 200 });
  } catch (err: any) {
    diagnostics.database.status = 'connection_failed';
    diagnostics.database.error = {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      stack: err?.stack?.slice(0, 500),
    };

    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed. Check details below.',
        diagnostics,
      },
      { status: 200 }
    );
  }
}
