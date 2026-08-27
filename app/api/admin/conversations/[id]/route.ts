import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, requireSuperAdmin } from '@/lib/session';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const params = await props.params;
    const conversationId = params.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, status: true },
        },
        profile: {
          select: { id: true, name: true, slug: true, avatarUrl: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Mark member messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderType: 'MEMBER',
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      conversation,
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderType: m.senderType,
        createdAt: m.createdAt,
        readAt: m.readAt,
      })),
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin fetch conversation error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const params = await props.params;
    const conversationId = params.id;
    const { status } = await req.json();

    if (!['ACTIVE', 'ARCHIVED', 'BLOCKED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status },
    });

    return NextResponse.json({ success: true, conversation: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'FORBIDDEN_READ_ONLY') {
      return NextResponse.json({ error: 'Forbidden: Super admin privileges required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}
