const express = require('express');
const router = express.Router();
const { prisma } = require('../db');
const { requireAuth } = require('../auth');

// GET /api/profiles
router.get('/', async (req, res) => {
  try {
    const profiles = await prisma.managedProfile.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { posts: { where: { status: 'PUBLISHED' } } },
        },
      },
    });

    return res.json({ profiles });
  } catch (error) {
    console.error('Profiles API error:', error);
    return res.status(500).json({ error: 'Failed to load profiles.' });
  }
});

// GET /api/profiles/:slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const profile = await prisma.managedProfile.findUnique({
      where: { slug },
      include: {
        posts: {
          where: { status: 'PUBLISHED' },
          include: {
            media: { orderBy: { displayOrder: 'asc' } },
            reactions: true,
            _count: { select: { comments: { where: { status: 'PUBLISHED' } }, reactions: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    return res.json({ profile });
  } catch (error) {
    console.error('Profile detail error:', error);
    return res.status(500).json({ error: 'Failed to load profile details.' });
  }
});

module.exports = router;
