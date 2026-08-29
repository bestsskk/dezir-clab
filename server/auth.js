const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { prisma } = require('./db');

const SALT_ROUNDS = 10;
const SESSION_COOKIE_NAME = 'community_vip_session';
const DEVICE_COOKIE_NAME = 'community_device_id';
const SESSION_MAX_AGE_DAYS = 30;

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateSecureToken(bytes = 20) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function generateInvitationCode() {
  return crypto.randomBytes(16).toString('base64url');
}

function sanitizeText(input) {
  if (!input) return '';
  return String(input)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

function isValidEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

function isValidPassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long.' };
  }
  return { valid: true };
}

function extractDeviceFromRequest(req) {
  const body = req.body || {};
  let deviceId = body.deviceId ? String(body.deviceId).trim() : null;

  if (!deviceId && req.headers['x-device-id']) {
    deviceId = String(req.headers['x-device-id']).trim();
  }

  if (!deviceId && req.cookies && req.cookies[DEVICE_COOKIE_NAME]) {
    deviceId = String(req.cookies[DEVICE_COOKIE_NAME]).trim();
  }

  const userAgent = req.headers['user-agent'] || '';
  let deviceInfo = body.deviceInfo ? String(body.deviceInfo).trim() : '';

  if (!deviceInfo) {
    let os = 'Unknown OS';
    let browser = 'Browser';

    if (/iPhone|iPad|iPod/.test(userAgent)) os = 'iOS';
    else if (/Android/.test(userAgent)) os = 'Android';
    else if (/Macintosh|Mac OS X/.test(userAgent)) os = 'macOS';
    else if (/Windows/.test(userAgent)) os = 'Windows';
    else if (/Linux/.test(userAgent)) os = 'Linux';

    if (/Edg/.test(userAgent)) browser = 'Edge';
    else if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) browser = 'Chrome';
    else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) browser = 'Safari';
    else if (/Firefox/.test(userAgent)) browser = 'Firefox';

    deviceInfo = `${browser} on ${os}`;
  }

  return {
    deviceId: deviceId && deviceId.length >= 6 ? deviceId : null,
    deviceInfo,
  };
}

async function createSession(userId, metadata = {}, res, req) {
  const sessionToken = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      deviceId: metadata.deviceId,
    },
  });

  if (res) {
    const isHttps = process.env.NODE_ENV === 'production' || 
                    process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') || 
                    (req && (req.secure || req.headers['x-forwarded-proto'] === 'https'));
    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: Boolean(isHttps),
      sameSite: isHttps ? 'none' : 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  }).catch(() => {});

  return sessionToken;
}

async function getCurrentUser(req) {
  const token = req.cookies?.[SESSION_COOKIE_NAME] || req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            avatarUrl: true,
            bio: true,
            deviceId: true,
            deviceInfo: true,
          },
        },
      },
    });

    if (!session) return null;

    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    if (session.user.status !== 'ACTIVE') {
      await prisma.session.deleteMany({ where: { userId: session.user.id } }).catch(() => {});
      return null;
    }

    return session.user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

async function requireAuth(req, res, next) {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  req.user = user;
  next();
}

async function requireAdmin(req, res, next) {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  if (user.role !== 'ADMIN' && user.role !== 'VIEWER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden. Administrative privileges required.' });
  }
  req.user = user;
  next();
}

async function requireSuperAdmin(req, res, next) {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Read-only administrative role. Mutating actions are disabled.' });
  }
  req.user = user;
  next();
}

async function createAuditLog(params, req) {
  try {
    const ip = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers['user-agent'] || undefined;

    return await prisma.adminAuditLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        detailsJson: params.details ? JSON.stringify(params.details) : undefined,
        ipAddress: params.ipAddress || ip,
        userAgent: params.userAgent || userAgent,
      },
    });
  } catch (err) {
    console.error('Failed to create audit log:', err.message);
  }
}

async function validateInvitationToken(token) {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return { valid: false, error: 'Invalid invitation token.' };
  }

  const cleanToken = token.trim();
  const invitation = await prisma.invitation.findUnique({
    where: { token: cleanToken },
  });

  if (!invitation || invitation.status !== 'ACTIVE') {
    return { valid: false, error: 'Sorry, this invitation link is invalid or has expired.' };
  }

  if (invitation.expiresAt && new Date() > invitation.expiresAt) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    }).catch(() => {});
    return { valid: false, error: 'Sorry, this invitation link is invalid or has expired.' };
  }

  if (invitation.currentUses >= invitation.maxUses) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXHAUSTED' },
    }).catch(() => {});
    return { valid: false, error: 'Sorry, this invitation link is invalid or has expired.' };
  }

  return { valid: true, invitation };
}

module.exports = {
  SESSION_COOKIE_NAME,
  DEVICE_COOKIE_NAME,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateInvitationCode,
  sanitizeText,
  isValidEmail,
  isValidPassword,
  extractDeviceFromRequest,
  createSession,
  getCurrentUser,
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
  createAuditLog,
  validateInvitationToken,
};
