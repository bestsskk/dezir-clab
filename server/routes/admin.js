const express = require('express');
const router = express.Router();
const { prisma } = require('../db');
const { requireAdmin, requireSuperAdmin, createAuditLog, hashPassword, generateInvitationCode, sanitizeText } = require('../auth');

// All routes here require at least VIEWER_ADMIN or ADMIN
router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalMembers, totalPosts, totalConversations, totalInvitations, totalProfiles] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.post.count(),
      prisma.conversation.count(),
      prisma.invitation.count(),
      prisma.managedProfile.count(),
    ]);

    const activeMembers = await prisma.user.count({
      where: { role: 'MEMBER', status: 'ACTIVE' },
    });

    const pendingReports = await prisma.commentReport.count({
      where: { status: 'PENDING' },
    });

    return res.json({
      totalMembers,
      activeMembers,
      totalPosts,
      totalConversations,
      totalInvitations,
      totalProfiles,
      pendingReports,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
});

// GET /api/admin/members
router.get('/members', async (req, res) => {
  try {
    const members = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatarUrl: true,
        deviceId: true,
        deviceInfo: true,
        deviceBoundAt: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return res.json({ members });
  } catch (error) {
    console.error('Admin members error:', error);
    return res.status(500).json({ error: 'Failed to load members.' });
  }
});

// POST /api/admin/members/:id (update status or role)
router.post('/members/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body || {};

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(role ? { role } : {}),
      },
    });

    if (status === 'BANNED' || status === 'SUSPENDED') {
      await prisma.session.deleteMany({ where: { userId: id } }).catch(() => {});
    }

    await createAuditLog(
      {
        adminUserId: req.user.id,
        action: `MEMBER_STATUS_UPDATED_${status || role}`,
        targetType: 'User',
        targetId: id,
        details: { status, role },
      },
      req
    );

    return res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Update member error:', error);
    return res.status(500).json({ error: 'Failed to update member.' });
  }
});

// POST /api/admin/members/:id/reset-device
router.post('/members/:id/reset-device', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: {
        deviceId: null,
        deviceInfo: null,
        deviceBoundAt: null,
      },
    });

    await prisma.session.deleteMany({ where: { userId: id } }).catch(() => {});

    await createAuditLog(
      {
        adminUserId: req.user.id,
        action: 'MEMBER_DEVICE_RESET',
        targetType: 'User',
        targetId: id,
        details: { email: user.email },
      },
      req
    );

    return res.json({ success: true, message: 'Device lock reset. User can bind on next login.' });
  } catch (error) {
    console.error('Reset device error:', error);
    return res.status(500).json({ error: 'Failed to reset member device.' });
  }
});

// POST /api/admin/members/:id/set-password
router.post('/members/:id/set-password', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const passwordHash = await hashPassword(newPassword.trim());
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await createAuditLog(
      {
        adminUserId: req.user.id,
        action: 'MEMBER_PASSWORD_OVERRIDE',
        targetType: 'User',
        targetId: id,
        details: { email: updatedUser.email },
      },
      req
    );

    return res.json({ success: true, message: 'Member password updated successfully.' });
  } catch (error) {
    console.error('Set member password error:', error);
    return res.status(500).json({ error: 'Failed to update member password.' });
  }
});

// GET /api/admin/profiles
router.get('/profiles', async (req, res) => {
  try {
    const profiles = await prisma.managedProfile.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { posts: true, conversations: true } },
      },
    });

    return res.json({ profiles });
  } catch (error) {
    console.error('Admin profiles error:', error);
    return res.status(500).json({ error: 'Failed to load profiles.' });
  }
});

// POST /api/admin/profiles
router.post('/profiles', requireSuperAdmin, async (req, res) => {
  try {
    const { name, bio, avatarUrl, coverUrl, age, location, status, isFeatured, displayOrder } = req.body || {};

    if (!name || !avatarUrl || !bio) {
      return res.status(400).json({ error: 'Name, avatar, and bio are required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

    const profile = await prisma.managedProfile.create({
      data: {
        name,
        slug,
        bio,
        avatarUrl,
        coverUrl: coverUrl || null,
        age: age ? parseInt(age, 10) : null,
        location: location || null,
        status: status || 'ACTIVE',
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : true,
        displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
      },
    });

    await createAuditLog(
      {
        adminUserId: req.user.id,
        action: 'PROFILE_CREATED',
        targetType: 'ManagedProfile',
        targetId: profile.id,
        details: { name: profile.name, slug: profile.slug },
      },
      req
    );

    return res.json({ success: true, profile });
  } catch (error) {
    console.error('Create profile error:', error);
    return res.status(500).json({ error: 'Failed to create profile.' });
  }
});

// PUT /api/admin/profiles/:id
router.put('/profiles/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, avatarUrl, coverUrl, age, location, status, isFeatured, displayOrder } = req.body || {};

    const profile = await prisma.managedProfile.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(bio ? { bio } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        coverUrl: coverUrl !== undefined ? coverUrl : undefined,
        age: age ? parseInt(age, 10) : undefined,
        location: location !== undefined ? location : undefined,
        status: status || undefined,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) : undefined,
      },
    });

    return res.json({ success: true, profile });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// GET /api/admin/posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        profile: { select: { id: true, name: true, slug: true, avatarUrl: true } },
        media: true,
        _count: { select: { reactions: true, comments: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });

    return res.json({ posts });
  } catch (error) {
    console.error('Admin posts error:', error);
    return res.status(500).json({ error: 'Failed to load posts.' });
  }
});

// POST /api/admin/posts
router.post('/posts', requireSuperAdmin, async (req, res) => {
  try {
    const { profileId, postType = 'STANDARD', caption, mediaUrls = [], isPinned = false, announcementTitle, announcementCtaText, announcementCtaLink } = req.body || {};

    if (!caption && (!mediaUrls || mediaUrls.length === 0)) {
      return res.status(400).json({ error: 'Post caption or media is required.' });
    }

    const post = await prisma.post.create({
      data: {
        profileId: profileId || null,
        authorUserId: req.user.id,
        postType,
        caption: caption || '',
        isPinned: Boolean(isPinned),
        announcementTitle: announcementTitle || null,
        announcementCtaText: announcementCtaText || null,
        announcementCtaLink: announcementCtaLink || null,
        media: {
          create: (mediaUrls || []).map((url, idx) => ({
            mediaUrl: typeof url === 'string' ? url : url.mediaUrl,
            mediaType: typeof url === 'string' && url.match(/\.(mp4|webm|mov)$/i) ? 'VIDEO' : 'IMAGE',
            displayOrder: idx,
          })),
        },
      },
      include: {
        profile: true,
        media: true,
      },
    });

    await createAuditLog(
      {
        adminUserId: req.user.id,
        action: 'POST_PUBLISHED',
        targetType: 'Post',
        targetId: post.id,
        details: { postType, isPinned },
      },
      req
    );

    return res.json({ success: true, post });
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({ error: 'Failed to create post.' });
  }
});

// POST /api/admin/posts/:id/pin
router.post('/posts/:id/pin', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body || {};

    const updated = await prisma.post.update({
      where: { id },
      data: { isPinned: Boolean(isPinned) },
    });

    return res.json({ success: true, post: updated });
  } catch (error) {
    console.error('Pin post error:', error);
    return res.status(500).json({ error: 'Failed to update post pin status.' });
  }
});

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.post.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// GET /api/admin/conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        member: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        profile: { select: { id: true, name: true, slug: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return res.json({ conversations });
  } catch (error) {
    console.error('Admin conversations error:', error);
    return res.status(500).json({ error: 'Failed to load conversations.' });
  }
});

// GET /api/admin/conversations/:id
router.get('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        profile: { select: { id: true, name: true, slug: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    return res.json({ conversation });
  } catch (error) {
    console.error('Admin conversation detail error:', error);
    return res.status(500).json({ error: 'Failed to load conversation.' });
  }
});

// POST /api/admin/conversations/:id/reply
router.post('/conversations/:id/reply', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body || {};

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Reply content cannot be empty.' });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const cleanText = sanitizeText(content);

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderType: 'ADMIN_PROFILE',
        senderUserId: req.user.id,
        content: cleanText,
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    await prisma.notification.create({
      data: {
        userId: conversation.memberId,
        type: 'NEW_MESSAGE',
        title: `Message from ${conversation.profile.name}`,
        message: cleanText.length > 60 ? cleanText.slice(0, 57) + '...' : cleanText,
        linkUrl: `/messages?id=${id}`,
      },
    }).catch(() => {});

    return res.json({ success: true, message });
  } catch (error) {
    console.error('Admin reply error:', error);
    return res.status(500).json({ error: 'Failed to send persona reply.' });
  }
});

// GET /api/admin/invitations
router.get('/invitations', async (req, res) => {
  try {
    const invitations = await prisma.invitation.findMany({
      include: {
        usedByMembers: { select: { id: true, firstName: true, lastName: true, email: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ invitations });
  } catch (error) {
    console.error('Admin invitations error:', error);
    return res.status(500).json({ error: 'Failed to load invitations.' });
  }
});

// POST /api/admin/invitations
router.post('/invitations', requireSuperAdmin, async (req, res) => {
  try {
    const { maxUses = 1, notes, expiresDays } = req.body || {};

    const token = generateInvitationCode();
    const expiresAt = expiresDays ? new Date(Date.now() + parseInt(expiresDays, 10) * 24 * 60 * 60 * 1000) : null;

    const invitation = await prisma.invitation.create({
      data: {
        token,
        maxUses: parseInt(maxUses, 10) || 1,
        status: 'ACTIVE',
        expiresAt,
        notes: notes ? sanitizeText(notes) : null,
        createdByUserId: req.user.id,
      },
    });

    await createAuditLog(
      {
        adminUserId: req.user.id,
        action: 'INVITATION_GENERATED',
        targetType: 'Invitation',
        targetId: invitation.id,
        details: { token: invitation.token, maxUses: invitation.maxUses },
      },
      req
    );

    return res.json({ success: true, invitation });
  } catch (error) {
    console.error('Generate invitation error:', error);
    return res.status(500).json({ error: 'Failed to create invitation.' });
  }
});

// DELETE /api/admin/invitations/:id
router.delete('/invitations/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.invitation.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete invitation error:', error);
    return res.status(500).json({ error: 'Failed to delete invitation.' });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await prisma.adminAuditLog.findMany({
      include: {
        adminUser: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json({ logs });
  } catch (error) {
    console.error('Audit logs error:', error);
    return res.status(500).json({ error: 'Failed to load audit logs.' });
  }
});

// GET /api/admin/settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findMany();
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return res.json({ settings: settingsMap });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return res.status(500).json({ error: 'Failed to load site settings.' });
  }
});

// POST /api/admin/settings
router.post('/settings', requireSuperAdmin, async (req, res) => {
  try {
    const { settings = {} } = req.body || {};

    for (const [key, value] of Object.entries(settings)) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    return res.json({ success: true, message: 'Settings saved.' });
  } catch (error) {
    console.error('Save settings error:', error);
    return res.status(500).json({ error: 'Failed to save settings.' });
  }
});

module.exports = router;
