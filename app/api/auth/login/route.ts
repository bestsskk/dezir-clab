import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { createSession, SESSION_COOKIE_NAME } from '@/lib/session';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/security';
import { extractDeviceFromRequest, DEVICE_COOKIE_NAME, DEVICE_COOKIE_MAX_AGE } from '@/lib/device';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Rate limit: max 8 login attempts per 5 minutes per IP
    const rateLimit = checkRateLimit(ip, 'login', 8, 300);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please provide both email and password.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Your account does not currently have access to this community.' },
        { status: 403 }
      );
    }

    // Extract device identifier & client details
    const device = extractDeviceFromRequest(req, body);
    let activeDeviceId = device.deviceId;

    // Strict Device Lock Enforcement for Members
    if (user.role === 'MEMBER') {
      if (user.deviceId) {
        // User already has a registered bound device
        if (!activeDeviceId || activeDeviceId !== user.deviceId) {
          await createAuditLog({
            action: 'LOGIN_BLOCKED_DEVICE_MISMATCH',
            targetType: 'User',
            targetId: user.id,
            details: {
              email: user.email,
              registeredDeviceId: user.deviceId,
              attemptedDeviceId: activeDeviceId || 'none',
              attemptedDeviceInfo: device.deviceInfo,
            },
            ipAddress: ip,
            userAgent: req.headers.get('user-agent') || undefined,
          });

          return NextResponse.json(
            {
              error:
                'Device Mismatch: This account is locked to the original device it was registered on. You cannot log in from a different device.',
              code: 'DEVICE_MISMATCH',
              registeredDeviceInfo: user.deviceInfo || 'Original Registered Device',
            },
            { status: 403 }
          );
        }
      } else {
        // Unbound user (e.g. initial setup or device was reset by Admin) -> bind to current device
        activeDeviceId = activeDeviceId || `dev_${crypto.randomBytes(16).toString('hex')}`;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            deviceId: activeDeviceId,
            deviceInfo: device.deviceInfo,
            deviceBoundAt: new Date(),
          },
        });

        await createAuditLog({
          action: 'MEMBER_DEVICE_BOUND_ON_LOGIN',
          targetType: 'User',
          targetId: user.id,
          details: {
            email: user.email,
            deviceId: activeDeviceId,
            deviceInfo: device.deviceInfo,
          },
          ipAddress: ip,
          userAgent: req.headers.get('user-agent') || undefined,
        });
      }
    }

    // Create session
    const sessionToken = await createSession(user.id, {
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || undefined,
      deviceId: activeDeviceId || undefined,
    });

    if (user.role === 'ADMIN' || user.role === 'VIEWER_ADMIN') {
      await createAuditLog({
        adminUserId: user.id,
        action: user.role === 'ADMIN' ? 'ADMIN_LOGIN' : 'VIEWER_ADMIN_LOGIN',
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || undefined,
      });
    }

    const isHttps = req.nextUrl.protocol === 'https:' || process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') || false;

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        deviceId: user.deviceId || activeDeviceId,
      },
      redirectUrl: user.role === 'ADMIN' || user.role === 'VIEWER_ADMIN' ? '/likecrazy' : '/dashboard',
    });

    // Explicitly set the session cookie on the response
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    // Set persistent device cookie if device identifier exists
    if (activeDeviceId) {
      response.cookies.set(DEVICE_COOKIE_NAME, activeDeviceId, {
        httpOnly: false,
        secure: isHttps,
        sameSite: 'lax',
        path: '/',
        maxAge: DEVICE_COOKIE_MAX_AGE,
      });
    }

    return response;
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
