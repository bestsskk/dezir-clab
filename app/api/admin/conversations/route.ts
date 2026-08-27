import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'ALL'; // ALL, UNREAD, ARCHIVED
    const search = searchParams.get('search') || '';

    const whereClause: any = {};
    if (filter === 'ARCHIVED') {
      whereClause.status = 'ARCHIVED';
    } else if (filter === 'BLOCKED') {
      whereClause.status = 'BLOCKED';
    } else {
      whereClause.status = 'ACTIVE';
    }

    if (search) {
      whereClause.OR = [
        { member: { firstName: { contains: search } } },
        { member: { lastName: { contains: search } } },
        { member: { email: { contains: search } } },
        { profile: { name: { contains: search } } },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, status: true },
        },
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
              where: { senderType: 'MEMBER', readAt: null },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        member: c.member,
        profile: c.profile,
        status: c.status,
        lastMessage: c.messages[0]?.content || '',
        lastMessageAt: c.lastMessageAt,
        unreadCount: c._count.messages,
      })),
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin conversations fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
