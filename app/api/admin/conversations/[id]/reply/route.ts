import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/session';
import { sanitizeText, createAuditLog } from '@/lib/security';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const params = await props.params;
    const conversationId = params.id;
    const { content, replyAsProfileId } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Reply content cannot be empty' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        member: true,
        profile: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const cleanContent = sanitizeText(content);

    // Create message from ADMIN_PROFILE persona
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderType: 'ADMIN_PROFILE',
        senderUserId: admin.id,
        content: cleanContent,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Send in-app notification to member
    await prisma.notification.create({
      data: {
        userId: conversation.memberId,
        type: 'NEW_MESSAGE',
        title: `${conversation.profile.name} sent you a message`,
        message: cleanContent.slice(0, 80) + (cleanContent.length > 80 ? '...' : ''),
        linkUrl: `/messages`,
      },
    });

    await createAuditLog({
      adminUserId: admin.id,
      action: 'ADMIN_REPLIED_AS_PROFILE',
      targetType: 'Conversation',
      targetId: conversationId,
      details: {
        profileName: conversation.profile.name,
        memberEmail: conversation.member.email,
      },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderType: message.senderType,
        createdAt: message.createdAt,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin reply error:', error);
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
  }
}
