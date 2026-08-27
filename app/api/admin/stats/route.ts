import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalMembers,
      activeMembers,
      newMembersToday,
      totalProfiles,
      totalPosts,
      totalReactions,
      totalComments,
      unreadMessages,
      activeInvitations,
      pendingPosts,
      recentMembers,
      recentMessages,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.user.count({ where: { role: 'MEMBER', status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'MEMBER', createdAt: { gte: todayStart } } }),
      prisma.managedProfile.count(),
      prisma.post.count(),
      prisma.reaction.count(),
      prisma.comment.count(),
      prisma.message.count({ where: { senderType: 'MEMBER', readAt: null } }),
      prisma.invitation.count({ where: { status: 'ACTIVE' } }),
      prisma.post.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.user.findMany({
        where: { role: 'MEMBER' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, firstName: true, lastName: true, email: true, status: true, createdAt: true, avatarUrl: true },
      }),
      prisma.message.findMany({
        where: { senderType: 'MEMBER' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          conversation: {
            include: {
              member: { select: { firstName: true, lastName: true, email: true } },
              profile: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const profiles = await prisma.managedProfile.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: {
            posts: true,
            conversations: true,
          },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalMembers,
        activeMembers,
        newMembersToday,
        totalProfiles,
        totalPosts,
        totalReactions,
        totalComments,
        unreadMessages,
        activeInvitations,
        pendingPosts,
      },
      profiles: profiles.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        avatarUrl: p.avatarUrl,
        bio: p.bio,
        location: p.location,
        status: p.status,
        displayOrder: p.displayOrder,
        totalPosts: p._count.posts,
        totalConversations: p._count.conversations,
      })),
      recentMembers,
      recentMessages: recentMessages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        memberName: `${m.conversation.member.firstName} ${m.conversation.member.lastName}`,
        profileName: m.conversation.profile.name,
      })),
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
