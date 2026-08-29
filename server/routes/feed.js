const express = require('express');
const router = express.Router();
const { prisma } = require('../db');
const { requireAuth } = require('../auth');

// GET /api/feed
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const filter = req.query.filter || 'latest';
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '15', 10);
    const skip = (page - 1) * limit;

    const now = new Date();

    const baseWhere = {
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

    let pinnedPosts = [];
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

    const regularWhere = {
      ...baseWhere,
      ...(pinnedPosts.length > 0 && page === 1 ? { isPinned: false } : {}),
    };

    const orderByClause =
      filter === 'popular'
        ? [{ reactions: { _count: 'desc' } }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }];

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

    const formatPost = (p) => {
      const userReaction = p.reactions.find((r) => r.userId === user.id)?.reactionType || null;

      const reactionBreakdown = {
        LIKE: 0,
        LOVE: 0,
        FIRE: 0,
        WOW: 0,
      };

      p.reactions.forEach((r) => {
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

    return res.json({
      pinnedPosts: pinnedPosts.map(formatPost),
      posts: regularPosts.map(formatPost),
      pagination: {
        page,
        limit,
        totalCount,
        hasMore: skip + regularPosts.length < totalCount,
      },
    });
  } catch (error) {
    console.error('Feed API error:', error);
    return res.status(500).json({ error: 'Failed to load community feed.' });
  }
});

module.exports = router;
