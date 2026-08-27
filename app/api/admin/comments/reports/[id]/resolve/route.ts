import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/session';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const params = await props.params;
    const reportId = params.id;
    const { action } = await req.json(); // "RESOLVE" | "DISMISS"

    const report = await prisma.commentReport.update({
      where: { id: reportId },
      data: {
        status: action === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED',
      },
      include: { comment: true },
    });

    if (action === 'DISMISS') {
      await prisma.comment.update({
        where: { id: report.commentId },
        data: { status: 'PUBLISHED' },
      });
    }

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'FORBIDDEN_READ_ONLY') {
      return NextResponse.json({ error: 'Forbidden: Super admin privileges required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to process report' }, { status: 500 });
  }
}
