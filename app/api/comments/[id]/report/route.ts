import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { sanitizeText } from '@/lib/security';

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
    const commentId = params.id;
    const body = await req.json().catch(() => ({}));
    const reason = sanitizeText(body.reason || 'Inappropriate content');

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    await prisma.commentReport.create({
      data: {
        commentId,
        reportedByUserId: user.id,
        reason,
        status: 'PENDING',
      },
    });

    // Mark comment as reported for moderation
    await prisma.comment.update({
      where: { id: commentId },
      data: { status: 'REPORTED' },
    });

    return NextResponse.json({ success: true, message: 'Comment has been reported for review.' });
  } catch (error) {
    console.error('Report comment error:', error);
    return NextResponse.json({ error: 'Failed to report comment' }, { status: 500 });
  }
}
