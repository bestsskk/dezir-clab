import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { sanitizeText } from '@/lib/security';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstName, lastName, bio, avatarUrl } = await req.json();

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: firstName ? sanitizeText(firstName) : user.firstName,
        lastName: lastName ? sanitizeText(lastName) : user.lastName,
        bio: bio !== undefined ? sanitizeText(bio) : user.bio,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : user.avatarUrl,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        avatarUrl: updated.avatarUrl,
        bio: updated.bio,
        role: updated.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
