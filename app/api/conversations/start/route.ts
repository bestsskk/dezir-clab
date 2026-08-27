import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId } = await req.json();
    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
    }

    const profile = await prisma.managedProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: {
        memberId_profileId: {
          memberId: user.id,
          profileId: profile.id,
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          memberId: user.id,
          profileId: profile.id,
          status: 'ACTIVE',
        },
      });
    }

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    return NextResponse.json({ error: 'Failed to start conversation' }, { status: 500 });
  }
}
