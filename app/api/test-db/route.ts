import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result: any = {
    step: 'starting',
    env: {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    },
    pgTest: null,
    prismaTest: null,
  };

  // 1. Test direct pg pool
  try {
    const rawUrl = process.env.DATABASE_URL || '';
    const pool = new Pool({
      connectionString: rawUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    const res = await pool.query('SELECT count(*) as user_count FROM "User"');
    result.pgTest = {
      status: 'success',
      userCount: res.rows[0]?.user_count,
    };
    await pool.end();
  } catch (err: any) {
    result.pgTest = {
      status: 'error',
      message: err?.message,
      code: err?.code,
    };
  }

  // 2. Test Prisma
  try {
    const { PrismaClient } = await import('@prisma/client');
    const p = new PrismaClient();
    const count = await p.user.count();
    result.prismaTest = {
      status: 'success',
      userCount: count,
    };
    await p.$disconnect();
  } catch (err: any) {
    result.prismaTest = {
      status: 'error',
      message: err?.message,
      code: err?.code,
      name: err?.name,
    };
  }

  return NextResponse.json(result, { status: 200 });
}
