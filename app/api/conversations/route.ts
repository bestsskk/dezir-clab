import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        memberId: user.id,
        status: { not: 'BLOCKED' },
      },
      include: {
        profile: {
          select: { id: true, name: true, slug: true, avatarUrl: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                senderType: 'ADMIN_PROFILE',
                readAt: null,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        profile: c.profile,
        lastMessage: c.messages[0]?.content || 'Start a conversation...',
        lastMessageAt: c.lastMessageAt,
        unreadCount: c._count.messages,
      })),
    });
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
