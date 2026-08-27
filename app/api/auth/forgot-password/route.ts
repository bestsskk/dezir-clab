import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateSecureToken, hashPassword } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(ip, 'forgot-pw', 4, 300);
    if (!rateLimit.success) {
      return NextResponse.json(
        { message: 'If an account exists for this email, you will receive instructions.' },
        { status: 200 }
      );
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { message: 'If an account exists for this email, you will receive instructions.' },
        { status: 200 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (user && user.status === 'ACTIVE') {
      const token = generateSecureToken(32);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2); // 2 hours

      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // In production, this would send an email with the link:
      // `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`
      console.log(`[PASSWORD RESET LINK for ${user.email}]: /reset-password/${token}`);
    }

    // Always return generic message to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists for this email, you will receive instructions.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: 'If an account exists for this email, you will receive instructions.' },
      { status: 200 }
    );
  }
}
