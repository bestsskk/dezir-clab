const express = require('express');
const router = express.Router();
const { prisma } = require('../db');
const { requireAuth, hashPassword, verifyPassword, sanitizeText, isValidPassword } = require('../auth');

// POST /api/account/profile
router.post('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, bio } = req.body || {};

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required.' });
    }

    const cleanFirstName = sanitizeText(firstName);
    const cleanLastName = sanitizeText(lastName);
    const cleanBio = bio ? sanitizeText(bio) : null;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: cleanFirstName,
        lastName: cleanLastName,
        bio: cleanBio,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatarUrl: true,
        bio: true,
      },
    });

    return res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Account update error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/account/password
router.post('/password', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current password and new password are required.' });
    }

    const passCheck = isValidPassword(newPassword);
    if (!passCheck.valid) {
      return res.status(400).json({ error: passCheck.reason || 'New password must be at least 8 characters long.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect current password.' });
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

module.exports = router;
