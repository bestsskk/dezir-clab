const express = require('express');
const router = express.Router();
const { prisma } = require('../db');
const { requireAuth, sanitizeText } = require('../auth');

// GET /api/conversations
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await prisma.conversation.findMany({
      where: {
        memberId: userId,
        status: 'ACTIVE',
      },
      include: {
        profile: {
          select: { id: true, name: true, slug: true, avatarUrl: true, bio: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                senderType: 'ADMIN_PROFILE',
                readAt: null,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const formatted = conversations.map((c) => ({
      id: c.id,
      profile: c.profile,
      lastMessage: c.messages[0] || null,
      lastMessageAt: c.lastMessageAt,
      unreadCount: c._count.messages,
    }));

    return res.json({ conversations: formatted });
  } catch (error) {
    console.error('Conversations list error:', error);
    return res.status(500).json({ error: 'Failed to load conversations.' });
  }
});

// POST /api/conversations/start
router.post('/start', requireAuth, async (req, res) => {
  try {
    const { profileId, initialMessage } = req.body || {};
    const memberId = req.user.id;

    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required.' });
    }

    const profile = await prisma.managedProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    let conversation = await prisma.conversation.findUnique({
      where: {
        memberId_profileId: {
          memberId,
          profileId,
        },
      },
      include: {
        profile: {
          select: { id: true, name: true, slug: true, avatarUrl: true },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          memberId,
          profileId,
          lastMessageAt: new Date(),
        },
        include: {
          profile: {
            select: { id: true, name: true, slug: true, avatarUrl: true },
          },
        },
      });
    }

    if (initialMessage && initialMessage.trim()) {
      const cleanContent = sanitizeText(initialMessage);
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'MEMBER',
          senderUserId: memberId,
          content: cleanContent,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    }

    return res.json({ success: true, conversation });
  } catch (error) {
    console.error('Start conversation error:', error);
    return res.status(500).json({ error: 'Failed to initiate conversation.' });
  }
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        profile: {
          select: { id: true, name: true, slug: true, avatarUrl: true, bio: true },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (conversation.memberId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'VIEWER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    });

    // Mark admin profile messages as read by member
    if (conversation.memberId === userId) {
      await prisma.message.updateMany({
        where: {
          conversationId: id,
          senderType: 'ADMIN_PROFILE',
          readAt: null,
        },
        data: { readAt: new Date() },
      }).catch(() => {});
    }

    return res.json({ conversation, messages });
  } catch (error) {
    console.error('Messages fetch error:', error);
    return res.status(500).json({ error: 'Failed to load messages.' });
  }
});

// POST /api/conversations/:id/messages
router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body || {};
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (conversation.memberId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const cleanText = sanitizeText(content);

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderType: 'MEMBER',
        senderUserId: userId,
        content: cleanText,
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    return res.json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
});

module.exports = router;
