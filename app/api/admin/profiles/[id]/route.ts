import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/session';
import { sanitizeText, createAuditLog } from '@/lib/security';

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const params = await props.params;
    const profileId = params.id;
    const body = await req.json();

    const existing = await prisma.managedProfile.findUnique({ where: { id: profileId } });
    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name) updateData.name = sanitizeText(body.name);
    if (body.slug) {
      const cleanSlug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      if (cleanSlug !== existing.slug) {
        const slugExists = await prisma.managedProfile.findUnique({ where: { slug: cleanSlug } });
        if (slugExists) {
          return NextResponse.json({ error: 'Slug is already in use.' }, { status: 400 });
        }
        updateData.slug = cleanSlug;
      }
    }
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    if (body.coverUrl !== undefined) updateData.coverUrl = body.coverUrl;
    if (body.bio !== undefined) updateData.bio = sanitizeText(body.bio);
    if (body.age !== undefined) updateData.age = body.age ? parseInt(body.age, 10) : null;
    if (body.location !== undefined) updateData.location = sanitizeText(body.location);
    if (body.status && ['ACTIVE', 'HIDDEN', 'DISABLED'].includes(body.status)) {
      updateData.status = body.status;
    }
    if (body.isFeatured !== undefined) updateData.isFeatured = Boolean(body.isFeatured);
    if (body.displayOrder !== undefined) updateData.displayOrder = parseInt(body.displayOrder, 10);

    const updated = await prisma.managedProfile.update({
      where: { id: profileId },
      data: updateData,
    });

    await createAuditLog({
      adminUserId: admin.id,
      action: 'PROFILE_EDITED',
      targetType: 'ManagedProfile',
      targetId: profileId,
      details: { name: updated.name, slug: updated.slug },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'FORBIDDEN_READ_ONLY') {
      return NextResponse.json({ error: 'Forbidden: Super admin privileges required' }, { status: 403 });
    }
    console.error('Admin edit profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const params = await props.params;
    const profileId = params.id;

    const existing = await prisma.managedProfile.findUnique({ where: { id: profileId } });
    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    await prisma.managedProfile.delete({
      where: { id: profileId },
    });

    await createAuditLog({
      adminUserId: admin.id,
      action: 'PROFILE_DELETED',
      targetType: 'ManagedProfile',
      targetId: profileId,
      details: { name: existing.name },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'FORBIDDEN_READ_ONLY') {
      return NextResponse.json({ error: 'Forbidden: Super admin privileges required' }, { status: 403 });
    }
    console.error('Admin delete profile error:', error);
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}
