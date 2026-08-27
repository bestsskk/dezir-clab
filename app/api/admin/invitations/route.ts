import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, requireSuperAdmin } from '@/lib/session';
import { generateInvitationCode } from '@/lib/auth';
import { sanitizeText, createAuditLog } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const invitations = await prisma.invitation.findMany({
      include: {
        usedByMembers: {
          select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
        },
        createdByUser: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      invitations: invitations.map((inv) => ({
        id: inv.id,
        token: inv.token,
        maxUses: inv.maxUses,
        currentUses: inv.currentUses,
        status: inv.status,
        expiresAt: inv.expiresAt,
        notes: inv.notes,
        createdAt: inv.createdAt,
        createdBy: inv.createdByUser ? `${inv.createdByUser.firstName} ${inv.createdByUser.lastName}` : 'Admin',
        usedBy: inv.usedByMembers.map((u) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          joinedAt: u.createdAt,
        })),
      })),
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin invitations fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const body = await req.json();
    const { maxUses = 1, expirationDays = 30, notes = '', customToken } = body;

    const token = customToken ? sanitizeText(customToken).trim() : generateInvitationCode();

    const existing = await prisma.invitation.findUnique({ where: { token } });
    if (existing) {
      return NextResponse.json({ error: 'Token already exists. Please generate a new one.' }, { status: 400 });
    }

    const expiresAt = expirationDays && Number(expirationDays) > 0
      ? new Date(Date.now() + Number(expirationDays) * 24 * 60 * 60 * 1000)
      : null;

    const invitation = await prisma.invitation.create({
      data: {
        token,
        maxUses: Number(maxUses) || 1,
        currentUses: 0,
        status: 'ACTIVE',
        expiresAt,
        notes: notes ? sanitizeText(notes) : null,
        createdByUserId: admin.id,
      },
    });

    await createAuditLog({
      adminUserId: admin.id,
      action: 'INVITATION_GENERATED',
      targetType: 'Invitation',
      targetId: invitation.id,
      details: { token: invitation.token, maxUses: invitation.maxUses, notes },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, invitation });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin create invitation error:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}
