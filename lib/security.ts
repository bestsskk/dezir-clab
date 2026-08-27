import { prisma } from './db';

export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

export function isValidPassword(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long.' };
  }
  return { valid: true };
}

export async function createAuditLog(params: {
  adminUserId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    return await prisma.adminAuditLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        detailsJson: params.details ? JSON.stringify(params.details) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

export interface InvitationValidationResult {
  valid: boolean;
  error?: string;
  invitation?: {
    id: string;
    token: string;
    maxUses: number;
    currentUses: number;
    status: string;
    expiresAt: Date | null;
    notes: string | null;
  };
}

export async function validateInvitationToken(token: string): Promise<InvitationValidationResult> {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return { valid: false, error: 'Invalid invitation token.' };
  }

  const cleanToken = token.trim();
  const invitation = await prisma.invitation.findUnique({
    where: { token: cleanToken },
  });

  if (!invitation) {
    return { valid: false, error: 'Sorry, this invitation link is invalid or has expired.' };
  }

  if (invitation.status !== 'ACTIVE') {
    return { valid: false, error: 'Sorry, this invitation link is invalid or has expired.' };
  }

  if (invitation.expiresAt && new Date() > invitation.expiresAt) {
    // Automatically mark expired
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    }).catch(() => {});
    return { valid: false, error: 'Sorry, this invitation link is invalid or has expired.' };
  }

  if (invitation.currentUses >= invitation.maxUses) {
    // Automatically mark exhausted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXHAUSTED' },
    }).catch(() => {});
    return { valid: false, error: 'Sorry, this invitation link is invalid or has expired.' };
  }

  return { valid: true, invitation };
}

export async function redeemInvitationToken(invitationId: string, memberUserId: string) {
  const inv = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!inv) return;

  const nextUses = inv.currentUses + 1;
  const isExhausted = nextUses >= inv.maxUses;

  await prisma.invitation.update({
    where: { id: invitationId },
    data: {
      currentUses: nextUses,
      status: isExhausted ? 'EXHAUSTED' : 'ACTIVE',
    },
  });

  await prisma.user.update({
    where: { id: memberUserId },
    data: { invitationId },
  });
}
