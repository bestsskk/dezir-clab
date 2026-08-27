import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, requireSuperAdmin } from '@/lib/session';
import { sanitizeText, createAuditLog } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId');
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (profileId) whereClause.profileId = profileId;
    if (status) whereClause.status = status;

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        profile: { select: { id: true, name: true, slug: true, avatarUrl: true } },
        media: { orderBy: { displayOrder: 'asc' } },
        _count: { select: { reactions: true, comments: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        profile: p.profile,
        postType: p.postType,
        caption: p.caption,
        status: p.status,
        isPinned: p.isPinned,
        pinnedOrder: p.pinnedOrder,
        announcementTitle: p.announcementTitle,
        announcementCtaText: p.announcementCtaText,
        announcementCtaLink: p.announcementCtaLink,
        scheduledAt: p.scheduledAt,
        createdAt: p.createdAt,
        media: p.media,
        totalReactions: p._count.reactions,
        totalComments: p._count.comments,
      })),
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin posts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const body = await req.json();
    const {
      profileId,
      postType = 'STANDARD',
      caption,
      status = 'PUBLISHED',
      isPinned = false,
      pinnedOrder = 0,
      announcementTitle,
      announcementCtaText,
      announcementCtaLink,
      scheduledAt,
      media = [],
    } = body;

    if (!caption && (!media || media.length === 0) && postType !== 'ANNOUNCEMENT') {
      return NextResponse.json({ error: 'Caption or media is required' }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        profileId: profileId || null,
        authorUserId: admin.id,
        postType,
        caption: caption ? sanitizeText(caption) : '',
        status,
        isPinned: Boolean(isPinned),
        pinnedOrder: Number(pinnedOrder) || 0,
        announcementTitle: announcementTitle ? sanitizeText(announcementTitle) : null,
        announcementCtaText: announcementCtaText ? sanitizeText(announcementCtaText) : null,
        announcementCtaLink: announcementCtaLink ? sanitizeText(announcementCtaLink) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        media: {
          create: media.map((m: any, idx: number) => ({
            mediaUrl: m.mediaUrl || m.url,
            mediaType: m.mediaType || 'IMAGE',
            caption: m.caption ? sanitizeText(m.caption) : null,
            displayOrder: idx,
            width: m.width,
            height: m.height,
            size: m.size,
            mimeType: m.mimeType,
          })),
        },
      },
      include: {
        profile: { select: { id: true, name: true, slug: true, avatarUrl: true } },
        media: true,
      },
    });

    await createAuditLog({
      adminUserId: admin.id,
      action: 'POST_PUBLISHED',
      targetType: 'Post',
      targetId: post.id,
      details: { postType: post.postType, isPinned: post.isPinned, profileId },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
