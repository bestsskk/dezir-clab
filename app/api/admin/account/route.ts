import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, requireSuperAdmin } from '@/lib/session';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { isValidEmail, isValidPassword, sanitizeText, createAuditLog } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const adminUser = await prisma.user.findUnique({
      where: { id: admin.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    return NextResponse.json({ admin: adminUser });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const body = await req.json();
    const { email, firstName, lastName, currentPassword, newPassword } = body;

    const dbAdmin = await prisma.user.findUnique({
      where: { id: admin.id },
    });

    if (!dbAdmin) {
      return NextResponse.json({ error: 'Admin record not found' }, { status: 404 });
    }

    // Require current password for security when changing email or password
    if (newPassword || (email && email.toLowerCase().trim() !== dbAdmin.email.toLowerCase())) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current master password is required to make security changes.' },
          { status: 400 }
        );
      }

      const isValid = await verifyPassword(currentPassword, dbAdmin.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Current master password is incorrect.' },
          { status: 400 }
        );
      }
    }

    const dataToUpdate: any = {};

    if (email && email.toLowerCase().trim() !== dbAdmin.email.toLowerCase()) {
      const cleanEmail = email.toLowerCase().trim();
      if (!isValidEmail(cleanEmail)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }

      // Check uniqueness
      const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (existing && existing.id !== dbAdmin.id) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }

      dataToUpdate.email = cleanEmail;
    }

    if (newPassword) {
      const passCheck = isValidPassword(newPassword);
      if (!passCheck.valid) {
        return NextResponse.json({ error: passCheck.reason || 'Password must be at least 8 characters.' }, { status: 400 });
      }

      dataToUpdate.passwordHash = await hashPassword(newPassword);
    }

    if (firstName) dataToUpdate.firstName = sanitizeText(firstName);
    if (lastName) dataToUpdate.lastName = sanitizeText(lastName);

    const updatedAdmin = await prisma.user.update({
      where: { id: dbAdmin.id },
      data: dataToUpdate,
    });

    await createAuditLog({
      adminUserId: dbAdmin.id,
      action: 'ADMIN_CREDENTIALS_UPDATED',
      targetType: 'User',
      targetId: dbAdmin.id,
      details: {
        emailUpdated: Boolean(dataToUpdate.email),
        passwordUpdated: Boolean(dataToUpdate.passwordHash),
      },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Admin credentials updated successfully.',
      admin: {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        firstName: updatedAdmin.firstName,
        lastName: updatedAdmin.lastName,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin account update error:', error);
    return NextResponse.json({ error: 'Failed to update admin credentials' }, { status: 500 });
  }
}
