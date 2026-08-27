import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const slug = params.slug;

    const profile = await prisma.managedProfile.findUnique({
      where: { slug },
      include: {
        posts: {
          where: { status: 'PUBLISHED' },
          include: {
            media: {
              orderBy: { displayOrder: 'asc' },
            },
            reactions: {
              select: { userId: true, reactionType: true },
            },
            _count: {
              select: { comments: { where: { status: 'PUBLISHED' } }, reactions: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile || profile.status === 'DISABLED') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Format posts
    const formattedPosts = profile.posts.map((p) => {
      const userReaction = p.reactions.find((r) => r.userId === user.id)?.reactionType || null;
      return {
        id: p.id,
        postType: p.postType,
        caption: p.caption,
        isPinned: p.isPinned,
        createdAt: p.createdAt,
        media: p.media,
        totalReactions: p._count.reactions,
        userReaction,
        totalComments: p._count.comments,
      };
    });

    // Extract all media items for the gallery view
    const allMedia = profile.posts.flatMap((p) =>
      p.media.map((m) => ({
        id: m.id,
        postId: p.id,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        caption: m.caption || p.caption,
        createdAt: m.createdAt,
      }))
    );

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name,
        slug: profile.slug,
        avatarUrl: profile.avatarUrl,
        coverUrl: profile.coverUrl,
        bio: profile.bio,
        age: profile.age,
        location: profile.location,
        isFeatured: profile.isFeatured,
      },
      posts: formattedPosts,
      gallery: allMedia,
    });
  } catch (error) {
    console.error('Profile slug API error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
