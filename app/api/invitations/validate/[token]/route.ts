import { NextRequest, NextResponse } from 'next/server';
import { validateInvitationToken } from '@/lib/security';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ token: string }> }
) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Rate limit: max 15 token validation attempts per minute per IP to prevent brute-forcing
    const rateLimit = checkRateLimit(ip, 'validate-invitation', 15, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { valid: false, error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const params = await props.params;
    const token = params.token;

    const result = await validateInvitationToken(token);
    if (!result.valid || !result.invitation) {
      return NextResponse.json(
        { valid: false, error: result.error || 'Sorry, this invitation link is invalid or has expired.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        token: result.invitation.token,
        notes: result.invitation.notes,
        expiresAt: result.invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Validate invitation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate invitation.' },
      { status: 500 }
    );
  }
}
