import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/session';
import { sanitizeText, createAuditLog } from '@/lib/security';

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const params = await props.params;
    const invitationId = params.id;
    const body = await req.json();

    const existing = await prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!existing) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.status && ['ACTIVE', 'EXPIRED', 'REVOKED', 'EXHAUSTED'].includes(body.status)) {
      updateData.status = body.status;
    }
    if (body.maxUses !== undefined) updateData.maxUses = Number(body.maxUses);
    if (body.notes !== undefined) updateData.notes = sanitizeText(body.notes);

    const updated = await prisma.invitation.update({
      where: { id: invitationId },
      data: updateData,
    });

    await createAuditLog({
      adminUserId: admin.id,
      action: 'INVITATION_UPDATED',
      targetType: 'Invitation',
      targetId: invitationId,
      details: updateData,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, invitation: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'FORBIDDEN_READ_ONLY') {
      return NextResponse.json({ error: 'Forbidden: Super admin privileges required' }, { status: 403 });
    }
    console.error('Admin update invitation error:', error);
    return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const params = await props.params;
    const invitationId = params.id;

    const existing = await prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!existing) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    await createAuditLog({
      adminUserId: admin.id,
      action: 'INVITATION_DELETED',
      targetType: 'Invitation',
      targetId: invitationId,
      details: { token: existing.token },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'FORBIDDEN_READ_ONLY') {
      return NextResponse.json({ error: 'Forbidden: Super admin privileges required' }, { status: 403 });
    }
    console.error('Admin delete invitation error:', error);
    return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 });
  }
}
