import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'ALL'; // ALL, REPORTED, PENDING_APPROVAL

    const whereClause: any = {};
    if (filter === 'REPORTED') {
      whereClause.status = 'REPORTED';
    } else if (filter === 'PENDING_APPROVAL') {
      whereClause.status = 'PENDING_APPROVAL';
    }

    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        post: {
          select: {
            id: true,
            caption: true,
            profile: { select: { name: true } },
          },
        },
        reports: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        status: c.status,
        createdAt: c.createdAt,
        user: c.user,
        post: c.post,
        reportsCount: c.reports.length,
        reports: c.reports,
      })),
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin comments fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
