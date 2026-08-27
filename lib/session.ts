import { cookies } from 'next/headers';
import { prisma } from './db';
import { generateSecureToken } from './auth';

export const SESSION_COOKIE_NAME = 'community_vip_session';
export const SESSION_MAX_AGE_DAYS = 30;

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  bio: string | null;
}

export async function createSession(
  userId: string,
  metadata?: { ipAddress?: string; userAgent?: string; deviceId?: string }
): Promise<string> {
  const sessionToken = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      deviceId: metadata?.deviceId,
    },
  });

  const isHttps = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') || false;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60,
  });

  // Update user last login
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  return sessionToken;
}

export async function getSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    return token || null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const token = await getSessionToken();
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
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    // Check member status (if banned or suspended, destroy session immediately)
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

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (user.role !== 'ADMIN' && user.role !== 'VIEWER_ADMIN') {
    throw new Error('FORBIDDEN');
  }
  return user;
}

export async function requireSuperAdmin(): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN_READ_ONLY');
  }
  return user;
}

export async function invalidateSession(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    await prisma.session.deleteMany({ where: { sessionToken: token } }).catch(() => {});
  }
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {}
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } }).catch(() => {});
}
