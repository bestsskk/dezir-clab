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
    const postId = params.id;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const nextPinned = !post.isPinned;
    const updated = await prisma.post.update({
      where: { id: postId },
      data: { isPinned: nextPinned },
    });

    await createAuditLog({
      adminUserId: admin.id,
      action: nextPinned ? 'POST_PINNED' : 'POST_UNPINNED',
      targetType: 'Post',
      targetId: postId,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, isPinned: updated.isPinned });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'FORBIDDEN_READ_ONLY') {
      return NextResponse.json({ error: 'Forbidden: Super admin privileges required' }, { status: 403 });
    }
    console.error('Admin toggle pin error:', error);
    return NextResponse.json({ error: 'Failed to toggle pin state' }, { status: 500 });
  }
}
