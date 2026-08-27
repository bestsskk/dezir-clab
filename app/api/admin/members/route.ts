import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';

    const whereClause: any = {
      role: 'MEMBER',
    };

    if (status !== 'ALL') {
      whereClause.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.AND = [
        {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { id: { contains: q, mode: 'insensitive' } },
            { deviceId: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const members = await prisma.user.findMany({
      where: whereClause,
      include: {
        invitation: {
          select: { token: true, notes: true },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
            sentMessages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        status: m.status,
        avatarUrl: m.avatarUrl,
        bio: m.bio,
        deviceId: m.deviceId,
        deviceInfo: m.deviceInfo,
        deviceBoundAt: m.deviceBoundAt,
        invitationToken: m.invitation?.token || null,
        invitationNotes: m.invitation?.notes || null,
        lastLoginAt: m.lastLoginAt,
        createdAt: m.createdAt,
        totalReactions: m._count.reactions,
        totalComments: m._count.comments,
        totalMessages: m._count.sentMessages,
      })),
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin members fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
