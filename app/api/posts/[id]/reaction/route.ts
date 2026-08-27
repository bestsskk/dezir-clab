import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const postId = params.id;
    const body = await req.json().catch(() => ({}));
    const reactionType = (body.reactionType || 'LIKE').toUpperCase();

    const allowedReactions = ['LIKE', 'LOVE', 'FIRE', 'WOW'];
    if (!allowedReactions.includes(reactionType)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const existingReaction = await prisma.reaction.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    let activeUserReaction: string | null = null;

    if (existingReaction) {
      if (existingReaction.reactionType === reactionType) {
        // Toggle OFF
        await prisma.reaction.delete({
          where: { id: existingReaction.id },
        });
        activeUserReaction = null;
      } else {
        // Switch reaction type
        await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: { reactionType },
        });
        activeUserReaction = reactionType;
      }
    } else {
      // Add new reaction
      await prisma.reaction.create({
        data: {
          postId,
          userId: user.id,
          reactionType,
        },
      });
      activeUserReaction = reactionType;
    }

    // Fetch updated counts & breakdown
    const allReactions = await prisma.reaction.findMany({
      where: { postId },
      select: { reactionType: true },
    });

    const breakdown: Record<string, number> = {
      LIKE: 0,
      LOVE: 0,
      FIRE: 0,
      WOW: 0,
    };

    allReactions.forEach((r) => {
      if (breakdown[r.reactionType] !== undefined) {
        breakdown[r.reactionType]++;
      }
    });

    return NextResponse.json({
      success: true,
      userReaction: activeUserReaction,
      totalReactions: allReactions.length,
      breakdown,
    });
  } catch (error) {
    console.error('Reaction API error:', error);
    return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
  }
}
