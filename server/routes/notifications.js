const express = require('express');
const router = express.Router();
const { prisma } = require('../db');
const { requireAuth } = require('../auth');

// GET /api/notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, readAt: null },
    });

    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Notifications error:', error);
    return res.status(500).json({ error: 'Failed to load notifications.' });
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Notification mark read error:', error);
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Notification read all error:', error);
    return res.status(500).json({ error: 'Failed to clear unread notifications.' });
  }
});

module.exports = router;
