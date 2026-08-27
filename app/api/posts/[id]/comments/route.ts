import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { sanitizeText } from '@/lib/security';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(
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

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        status: { in: ['PUBLISHED', 'REPORTED'] },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        user: c.user,
        isOwnComment: c.userId === user.id,
        canDelete: c.userId === user.id || user.role === 'ADMIN',
      })),
    });
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = checkRateLimit(user.id, 'post-comment', 10, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Please slow down. You are posting comments too quickly.' },
        { status: 429 }
      );
    }

    const params = await props.params;
    const postId = params.id;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content cannot be empty.' }, { status: 400 });
    }

    // Check site settings for comments
    const commentSetting = await prisma.siteSetting.findUnique({
      where: { key: 'comment_mode' },
    });

    if (commentSetting && commentSetting.value === 'disabled') {
      return NextResponse.json({ error: 'Comments are currently disabled.' }, { status: 403 });
    }

    const initialStatus =
      commentSetting && commentSetting.value === 'approval' && user.role !== 'ADMIN'
        ? 'PENDING_APPROVAL'
        : 'PUBLISHED';

    const cleanContent = sanitizeText(content.slice(0, 1000));

    const newComment = await prisma.comment.create({
      data: {
        postId,
        userId: user.id,
        content: cleanContent,
        status: initialStatus,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      comment: {
        id: newComment.id,
        content: newComment.content,
        createdAt: newComment.createdAt,
        user: newComment.user,
        isOwnComment: true,
        canDelete: true,
        status: newComment.status,
      },
    });
  } catch (error) {
    console.error('Post comment error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
