import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profiles = await prisma.managedProfile.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: {
            posts: {
              where: { status: 'PUBLISHED' },
            },
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({
      profiles: profiles.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        avatarUrl: p.avatarUrl,
        coverUrl: p.coverUrl,
        bio: p.bio,
        age: p.age,
        location: p.location,
        isFeatured: p.isFeatured,
        postCount: p._count.posts,
      })),
    });
  } catch (error) {
    console.error('Profiles API error:', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}
