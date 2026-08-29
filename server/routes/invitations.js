const express = require('express');
const router = express.Router();
const { validateInvitationToken } = require('../auth');

// GET /api/invitations/validate/:token
router.get('/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const validation = await validateInvitationToken(token);

    if (!validation.valid || !validation.invitation) {
      return res.status(400).json({ valid: false, error: validation.error || 'Invalid or expired invitation token.' });
    }

    return res.json({
      valid: true,
      invitation: {
        token: validation.invitation.token,
        status: validation.invitation.status,
      },
    });
  } catch (error) {
    console.error('Invitation validation error:', error);
    return res.status(500).json({ valid: false, error: 'Failed to validate invitation token.' });
  }
});

module.exports = router;
