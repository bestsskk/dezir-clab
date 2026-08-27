import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'latest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const skip = (page - 1) * limit;

    const now = new Date();

    // Base condition: published, and not scheduled for future
    const baseWhere: any = {
      status: 'PUBLISHED',
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: now } },
      ],
    };

    if (filter === 'announcements') {
      baseWhere.postType = 'ANNOUNCEMENT';
    } else if (filter === 'photos') {
      baseWhere.media = { some: { mediaType: 'IMAGE' } };
    } else if (filter === 'videos') {
      baseWhere.media = { some: { mediaType: 'VIDEO' } };
    }

    // 1. Fetch pinned posts (only on page 1)
    let pinnedPosts: any[] = [];
    if (page === 1 && (filter === 'latest' || filter === 'announcements')) {
      pinnedPosts = await prisma.post.findMany({
        where: {
          ...baseWhere,
          isPinned: true,
        },
        include: {
          profile: {
            select: { id: true, name: true, slug: true, avatarUrl: true },
          },
          media: {
            orderBy: { displayOrder: 'asc' },
          },
          reactions: {
            select: { userId: true, reactionType: true },
          },
          _count: {
            select: { comments: { where: { status: 'PUBLISHED' } }, reactions: true },
          },
        },
        orderBy: [{ pinnedOrder: 'asc' }, { createdAt: 'desc' }],
      });
    }

    // 2. Fetch regular feed posts
    const regularWhere = {
      ...baseWhere,
      ...(pinnedPosts.length > 0 && page === 1 ? { isPinned: false } : {}),
    };

    const orderByClause =
      filter === 'popular'
        ? [{ reactions: { _count: 'desc' as const } }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

    const [regularPosts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: regularWhere,
        include: {
          profile: {
            select: { id: true, name: true, slug: true, avatarUrl: true },
          },
          media: {
            orderBy: { displayOrder: 'asc' },
          },
          reactions: {
            select: { userId: true, reactionType: true },
          },
          _count: {
            select: { comments: { where: { status: 'PUBLISHED' } }, reactions: true },
          },
        },
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
      prisma.post.count({ where: regularWhere }),
    ]);

    // Format posts with reaction breakdown and current user's reaction
    const formatPost = (p: any) => {
      const userReaction = p.reactions.find((r: any) => r.userId === user.id)?.reactionType || null;
      
      const reactionBreakdown: Record<string, number> = {
        LIKE: 0,
        LOVE: 0,
        FIRE: 0,
        WOW: 0,
      };

      p.reactions.forEach((r: any) => {
        if (reactionBreakdown[r.reactionType] !== undefined) {
          reactionBreakdown[r.reactionType]++;
        }
      });

      return {
        id: p.id,
        postType: p.postType,
        caption: p.caption,
        isPinned: p.isPinned,
        announcementTitle: p.announcementTitle,
        announcementCtaText: p.announcementCtaText,
        announcementCtaLink: p.announcementCtaLink,
        createdAt: p.createdAt,
        profile: p.profile,
        media: p.media,
        totalReactions: p._count.reactions,
        reactionBreakdown,
        userReaction,
        totalComments: p._count.comments,
      };
    };

    const formattedPinned = pinnedPosts.map(formatPost);
    const formattedRegular = regularPosts.map(formatPost);

    return NextResponse.json({
      pinnedPosts: formattedPinned,
      posts: formattedRegular,
      pagination: {
        page,
        limit,
        totalCount,
        hasMore: skip + regularPosts.length < totalCount,
      },
    });
  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json({ error: 'Failed to load community feed.' }, { status: 500 });
  }
}
