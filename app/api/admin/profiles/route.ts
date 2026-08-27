import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, requireSuperAdmin } from '@/lib/session';
import { sanitizeText, createAuditLog } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const profiles = await prisma.managedProfile.findMany({
      include: {
        _count: {
          select: {
            posts: true,
            conversations: true,
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      profiles: profiles.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        avatarUrl: p.avatarUrl,
        coverUrl: p.coverUrl,
        bio: p.bio,
        age: p.age,
        location: p.location,
        status: p.status,
        isFeatured: p.isFeatured,
        displayOrder: p.displayOrder,
        totalPosts: p._count.posts,
        totalConversations: p._count.conversations,
        createdAt: p.createdAt,
      })),
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin profiles fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const body = await req.json();
    const { name, slug, avatarUrl, coverUrl, bio, age, location, status, isFeatured, displayOrder } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const existing = await prisma.managedProfile.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return NextResponse.json({ error: 'A profile with this slug already exists' }, { status: 400 });
    }

    const newProfile = await prisma.managedProfile.create({
      data: {
        name: sanitizeText(name),
        slug: cleanSlug,
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        coverUrl: coverUrl || null,
        bio: sanitizeText(bio || ''),
        age: age ? parseInt(age, 10) : null,
        location: location ? sanitizeText(location) : null,
        status: status || 'ACTIVE',
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : true,
        displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
      },
    });

    await createAuditLog({
      adminUserId: admin.id,
      action: 'PROFILE_CREATED',
      targetType: 'ManagedProfile',
      targetId: newProfile.id,
      details: { name: newProfile.name, slug: newProfile.slug },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, profile: newProfile });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin create profile error:', error);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}
