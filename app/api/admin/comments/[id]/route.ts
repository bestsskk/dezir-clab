import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/session';
import { createAuditLog } from '@/lib/security';

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const params = await props.params;
    const commentId = params.id;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    await createAuditLog({
      adminUserId: admin.id,
      action: 'COMMENT_DELETED_BY_ADMIN',
      targetType: 'Comment',
      targetId: commentId,
      details: { content: comment.content },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'FORBIDDEN_READ_ONLY') {
      return NextResponse.json({ error: 'Forbidden: Super admin privileges required' }, { status: 403 });
    }
    console.error('Admin delete comment error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const params = await props.params;
    const commentId = params.id;
    const { status } = await req.json();

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { status },
    });

    return NextResponse.json({ success: true, comment: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'FORBIDDEN_READ_ONLY') {
      return NextResponse.json({ error: 'Forbidden: Super admin privileges required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}
