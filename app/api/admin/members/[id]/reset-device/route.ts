import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/session';
import { createAuditLog } from '@/lib/security';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const params = await props.params;
    const memberId = params.id;

    const existing = await prisma.user.findUnique({ where: { id: memberId } });
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Reset device binding
    const updated = await prisma.user.update({
      where: { id: memberId },
      data: {
        deviceId: null,
        deviceInfo: null,
        deviceBoundAt: null,
      },
    });

    // Invalidate any existing sessions for this user so they can log in cleanly from their new device
    await prisma.session.deleteMany({
      where: { userId: memberId },
    });

    await createAuditLog({
      adminUserId: admin.id,
      action: 'ADMIN_RESET_MEMBER_DEVICE',
      targetType: 'User',
      targetId: memberId,
      details: {
        email: existing.email,
        previousDeviceId: existing.deviceId,
        previousDeviceInfo: existing.deviceInfo,
      },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Device lock has been reset. The member may now log in from a new device to bind it.',
      member: {
        id: updated.id,
        deviceId: null,
        deviceInfo: null,
        deviceBoundAt: null,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin reset member device error:', error);
    return NextResponse.json({ error: 'Failed to reset device lock' }, { status: 500 });
  }
}
