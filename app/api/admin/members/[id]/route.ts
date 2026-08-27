import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/session';
import { createAuditLog } from '@/lib/security';

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const params = await props.params;
    const memberId = params.id;
    const { status, firstName, lastName } = await req.json();

    const existing = await prisma.user.findUnique({ where: { id: memberId } });
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (status && ['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      dataToUpdate.status = status;
    }
    if (firstName) dataToUpdate.firstName = firstName;
    if (lastName) dataToUpdate.lastName = lastName;

    const updated = await prisma.user.update({
      where: { id: memberId },
      data: dataToUpdate,
    });

    // If member is banned or suspended, invalidate all active sessions immediately
    if (status === 'BANNED' || status === 'SUSPENDED') {
      await prisma.session.deleteMany({
        where: { userId: memberId },
      });
    }

    await createAuditLog({
      adminUserId: admin.id,
      action: status ? `MEMBER_STATUS_${status}` : 'MEMBER_UPDATED',
      targetType: 'User',
      targetId: memberId,
      details: { previousStatus: existing.status, newStatus: status },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'FORBIDDEN_READ_ONLY') {
      return NextResponse.json({ error: 'Forbidden: Read-only viewer admin cannot modify members' }, { status: 403 });
    }
    console.error('Admin update member error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.user.delete({
      where: { id: memberId },
    });

    await createAuditLog({
      adminUserId: admin.id,
      action: 'MEMBER_DELETED',
      targetType: 'User',
      targetId: memberId,
      details: { email: existing.email },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin delete member error:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
