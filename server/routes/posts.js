const express = require('express');
const router = express.Router();
const { prisma } = require('../db');
const { requireAuth, sanitizeText } = require('../auth');

// POST /api/posts/:id/reaction
router.post('/:id/reaction', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType = 'LIKE' } = req.body || {};
    const userId = req.user.id;

    const existingReaction = await prisma.reaction.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId,
        },
      },
    });

    if (existingReaction) {
      if (existingReaction.reactionType === reactionType) {
        // Remove reaction
        await prisma.reaction.delete({
          where: { id: existingReaction.id },
        });
        return res.json({ success: true, action: 'removed', reactionType: null });
      } else {
        // Update reaction
        const updated = await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: { reactionType },
        });
        return res.json({ success: true, action: 'updated', reactionType: updated.reactionType });
      }
    } else {
      // Create reaction
      const created = await prisma.reaction.create({
        data: {
          postId: id,
          userId,
          reactionType,
        },
      });
      return res.json({ success: true, action: 'added', reactionType: created.reactionType });
    }
  } catch (error) {
    console.error('Reaction error:', error);
    return res.status(500).json({ error: 'Failed to update reaction.' });
  }
});

// GET /api/posts/:id/comments
router.get('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: {
        postId: id,
        status: 'PUBLISHED',
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ comments });
  } catch (error) {
    console.error('Comments fetch error:', error);
    return res.status(500).json({ error: 'Failed to load comments.' });
  }
});

// POST /api/posts/:id/comments
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body || {};
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    const cleanText = sanitizeText(content);

    const comment = await prisma.comment.create({
      data: {
        postId: id,
        userId,
        content: cleanText,
        status: 'PUBLISHED',
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true },
        },
      },
    });

    return res.json({ success: true, comment });
  } catch (error) {
    console.error('Comment creation error:', error);
    return res.status(500).json({ error: 'Failed to post comment.' });
  }
});

module.exports = router;
