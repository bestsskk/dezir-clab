import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { validateInvitationToken, redeemInvitationToken, isValidEmail, isValidPassword, sanitizeText, createAuditLog } from '@/lib/security';
import { checkRateLimit } from '@/lib/rate-limit';
import { extractDeviceFromRequest, DEVICE_COOKIE_NAME, DEVICE_COOKIE_MAX_AGE } from '@/lib/device';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Rate limit: max 5 registration attempts per 10 minutes per IP
    const rateLimit = checkRateLimit(ip, 'register', 5, 600);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { firstName, lastName, email, password, invitationToken, termsAccepted } = body;

    // Extract device identifier & metadata
    const device = extractDeviceFromRequest(req, body);
    const boundDeviceId = device.deviceId || `dev_${crypto.randomBytes(16).toString('hex')}`;
    const boundDeviceInfo = device.deviceInfo;

    // 1. Strict invitation token validation
    if (!invitationToken) {
      return NextResponse.json(
        { error: 'An active private invitation token is required to register.' },
        { status: 403 }
      );
    }

    const validation = await validateInvitationToken(invitationToken);
    if (!validation.valid || !validation.invitation) {
      return NextResponse.json(
        { error: validation.error || 'Sorry, this invitation link is invalid or has expired.' },
        { status: 400 }
      );
    }

    // 2. Validate input fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: 'You must accept the community terms and guidelines.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const passCheck = isValidPassword(password);
    if (!passCheck.valid) {
      return NextResponse.json(
        { error: passCheck.reason || 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // 3. Check for existing account
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please log in.' },
        { status: 409 }
      );
    }

    // 4. Create Member Account & Redeem Invitation in an Atomic Transaction (Race Condition Proof)
    const passwordHash = await hashPassword(password);
    const cleanFirstName = sanitizeText(firstName);
    const cleanLastName = sanitizeText(lastName);

    const user = await prisma.$transaction(async (tx) => {
      // Re-verify and atomically reserve invitation slot inside transaction
      const inv = await tx.invitation.findUnique({
        where: { id: validation.invitation!.id },
      });

      if (!inv || inv.status !== 'ACTIVE' || (inv.expiresAt && new Date() > inv.expiresAt) || inv.currentUses >= inv.maxUses) {
        throw new Error('INVITATION_EXHAUSTED');
      }

      const nextUses = inv.currentUses + 1;
      const isExhausted = nextUses >= inv.maxUses;

      await tx.invitation.update({
        where: { id: inv.id },
        data: {
          currentUses: nextUses,
          status: isExhausted ? 'EXHAUSTED' : 'ACTIVE',
        },
      });

      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          firstName: cleanFirstName,
          lastName: cleanLastName,
          role: 'MEMBER',
          status: 'ACTIVE',
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanFirstName + ' ' + cleanLastName)}&backgroundColor=1e293b&textColor=f8fafc`,
          deviceId: boundDeviceId,
          deviceInfo: boundDeviceInfo,
          deviceBoundAt: new Date(),
          invitationId: inv.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: newUser.id,
          type: 'ANNOUNCEMENT',
          title: 'Welcome to Dezir Clab',
          message: 'Your private invitation has been verified. Your account is secured and bound to this device.',
          linkUrl: '/dashboard',
        },
      });

      return newUser;
    });

    // 7. Audit log & Create Session
    await createAuditLog({
      action: 'MEMBER_REGISTERED_DEVICE_BOUND',
      targetType: 'User',
      targetId: user.id,
      details: {
        email: user.email,
        invitationToken: validation.invitation.token,
        deviceId: boundDeviceId,
        deviceInfo: boundDeviceInfo,
      },
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    await createSession(user.id, {
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || undefined,
      deviceId: boundDeviceId,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        deviceId: boundDeviceId,
      },
      redirectUrl: '/dashboard',
    });

    // Ensure persistent device cookie is written
    response.cookies.set(DEVICE_COOKIE_NAME, boundDeviceId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: DEVICE_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
