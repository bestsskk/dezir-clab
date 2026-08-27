import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSecureToken(bytes = 20): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function generateInvitationCode(): string {
  // Generates clean, cryptographically secure 24-character token
  return crypto.randomBytes(16).toString('base64url');
}
