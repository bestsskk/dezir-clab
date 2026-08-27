import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/session';

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const params = await props.params;
    const mediaId = params.id;

    await prisma.postMedia.delete({
      where: { id: mediaId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'FORBIDDEN_READ_ONLY') {
      return NextResponse.json({ error: 'Forbidden: Super admin privileges required' }, { status: 403 });
    }
    console.error('Admin delete media error:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
