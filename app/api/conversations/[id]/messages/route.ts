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
    const conversationId = params.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        profile: {
          select: { id: true, name: true, slug: true, avatarUrl: true, bio: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.memberId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Mark unread messages from admin_profile as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderType: 'ADMIN_PROFILE',
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        profile: conversation.profile,
        status: conversation.status,
      },
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderType: m.senderType,
        isOwn: m.senderType === 'MEMBER',
        createdAt: m.createdAt,
        readAt: m.readAt,
      })),
    });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
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

    const rateLimit = checkRateLimit(user.id, 'send-msg', 20, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'You are sending messages too quickly. Please slow down.' },
        { status: 429 }
      );
    }

    const params = await props.params;
    const conversationId = params.id;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.memberId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (conversation.status === 'BLOCKED') {
      return NextResponse.json(
        { error: 'This conversation is closed.' },
        { status: 403 }
      );
    }

    const cleanContent = sanitizeText(content.slice(0, 2000));

    const newMessage = await prisma.message.create({
      data: {
        conversationId,
        senderType: 'MEMBER',
        senderUserId: user.id,
        content: cleanContent,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        content: newMessage.content,
        senderType: newMessage.senderType,
        isOwn: true,
        createdAt: newMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
