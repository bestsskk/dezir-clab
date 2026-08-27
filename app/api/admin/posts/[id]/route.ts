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
    const postId = params.id;
    const body = await req.json();

    const existing = await prisma.post.findUnique({ where: { id: postId } });
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.caption !== undefined) updateData.caption = sanitizeText(body.caption);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isPinned !== undefined) updateData.isPinned = Boolean(body.isPinned);
    if (body.pinnedOrder !== undefined) updateData.pinnedOrder = Number(body.pinnedOrder);
    if (body.announcementTitle !== undefined) updateData.announcementTitle = sanitizeText(body.announcementTitle);
    if (body.announcementCtaText !== undefined) updateData.announcementCtaText = sanitizeText(body.announcementCtaText);
    if (body.announcementCtaLink !== undefined) updateData.announcementCtaLink = sanitizeText(body.announcementCtaLink);
    if (body.profileId !== undefined) updateData.profileId = body.profileId;

    const updated = await prisma.post.update({
      where: { id: postId },
      data: updateData,
    });

    await createAuditLog({
      adminUserId: admin.id,
      action: 'POST_EDITED',
      targetType: 'Post',
      targetId: postId,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'FORBIDDEN_READ_ONLY') {
      return NextResponse.json({ error: 'Forbidden: Super admin privileges required' }, { status: 403 });
    }
    console.error('Admin edit post error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const params = await props.params;
    const postId = params.id;

    const existing = await prisma.post.findUnique({ where: { id: postId } });
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    await createAuditLog({
      adminUserId: admin.id,
      action: 'POST_DELETED',
      targetType: 'Post',
      targetId: postId,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'FORBIDDEN_READ_ONLY') {
      return NextResponse.json({ error: 'Forbidden: Super admin privileges required' }, { status: 403 });
    }
    console.error('Admin delete post error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
