import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getInitialAvatar } from '../lib/avatar';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create or verify Admin account
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@community.vip';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword2026!';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        firstName: 'Alexander',
        lastName: 'Vance',
        role: 'ADMIN',
        status: 'ACTIVE',
        avatarUrl: getInitialAvatar('Alexander'),
        bio: 'Founder & Community Director of Dezir Clab.',
      },
    });
    console.log(`✅ Admin account created: ${admin.email}`);
  } else {
    console.log(`ℹ️ Admin account already exists: ${admin.email}`);
  }

  // 2. Create the 10 Indian Female Managed Profiles with Google-style Initial Avatars & No Cover Images
  const managedProfilesData = [
    {
      name: 'Priya Sharma',
      slug: 'priya',
      avatarUrl: getInitialAvatar('Priya Sharma'),
      coverUrl: null,
      bio: 'Independent creative director & lifestyle curator from South Mumbai. I like meeting energetic younger guys, feel free to message me anytime!',
      age: 32,
      location: 'Mumbai, India',
      isFeatured: true,
      displayOrder: 1,
    },
    {
      name: 'Ananya Sen',
      slug: 'ananya',
      avatarUrl: getInitialAvatar('Ananya Sen'),
      coverUrl: null,
      bio: 'Fashion stylist & interior consultant. Love good conversations, travel & relaxed evenings. I really like younger guys, feel free to message me!',
      age: 29,
      location: 'Kolkata, India',
      isFeatured: true,
      displayOrder: 2,
    },
    {
      name: 'Meera Kapoor',
      slug: 'meera',
      avatarUrl: getInitialAvatar('Meera Kapoor'),
      coverUrl: null,
      bio: 'Entrepreneur & art collector based in Delhi. Passionate about fitness, luxury escapes and vibrant chats. I like charming younger guys, feel free to message me!',
      age: 36,
      location: 'New Delhi, India',
      isFeatured: true,
      displayOrder: 3,
    },
    {
      name: 'Sunita Rao',
      slug: 'sunita',
      avatarUrl: getInitialAvatar('Sunita Rao'),
      coverUrl: null,
      bio: 'Senior architect & design lead in Bengaluru. Love weekend getaways, good wine and fun company. I like younger guys, feel free to message me!',
      age: 42,
      location: 'Bengaluru, India',
      isFeatured: true,
      displayOrder: 4,
    },
    {
      name: 'Kavita Verma',
      slug: 'kavita',
      avatarUrl: getInitialAvatar('Kavita Verma'),
      coverUrl: null,
      bio: 'Wellness consultant & yoga enthusiast living life with positive vibes. I enjoy connecting with ambitious younger guys, feel free to message me!',
      age: 38,
      location: 'Pune, India',
      isFeatured: true,
      displayOrder: 5,
    },
    {
      name: 'Pooja Patel',
      slug: 'pooja',
      avatarUrl: getInitialAvatar('Pooja Patel'),
      coverUrl: null,
      bio: 'Digital media executive & event curator. Always up for exciting discussions and weekend road trips. I like fun younger guys, feel free to message me!',
      age: 31,
      location: 'Ahmedabad, India',
      isFeatured: true,
      displayOrder: 6,
    },
    {
      name: 'Neha Singhania',
      slug: 'neha',
      avatarUrl: getInitialAvatar('Neha Singhania'),
      coverUrl: null,
      bio: 'Jewelry designer & boutique owner. Enjoy late night chats, music and creative minds. I like smart younger guys, feel free to message me!',
      age: 34,
      location: 'Jaipur, India',
      isFeatured: true,
      displayOrder: 7,
    },
    {
      name: 'Ritu Malhotra',
      slug: 'ritu',
      avatarUrl: getInitialAvatar('Ritu Malhotra'),
      coverUrl: null,
      bio: 'Independent business owner & culinary lover. Looking to connect with lively members. I like handsome younger guys, feel free to message me!',
      age: 40,
      location: 'Chandigarh, India',
      isFeatured: true,
      displayOrder: 8,
    },
    {
      name: 'Rekha Joshi',
      slug: 'rekha',
      avatarUrl: getInitialAvatar('Rekha Joshi'),
      coverUrl: null,
      bio: 'Consultant & classical music lover. Love deep conversations and sweet vibes. I really like younger guys, feel free to message me!',
      age: 44,
      location: 'Hyderabad, India',
      isFeatured: true,
      displayOrder: 9,
    },
    {
      name: 'Shalini Nair',
      slug: 'shalini',
      avatarUrl: getInitialAvatar('Shalini Nair'),
      coverUrl: null,
      bio: 'Brand strategist & coffee connoisseur. Casual, warm and outgoing. I like outgoing younger guys, feel free to message me!',
      age: 30,
      location: 'Kochi, India',
      isFeatured: true,
      displayOrder: 10,
    },
  ];

  // Remove old profiles that don't match our new set
  const oldSlugs = ['sophia', 'emma', 'olivia', 'mia', 'ava', 'isabella', 'amelia', 'charlotte', 'harper', 'evelyn'];
  await prisma.managedProfile.deleteMany({
    where: { slug: { in: oldSlugs } },
  }).catch(() => {});

  const createdProfiles = [];
  for (const p of managedProfilesData) {
    const profile = await prisma.managedProfile.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        avatarUrl: p.avatarUrl,
        coverUrl: null,
        bio: p.bio,
        age: p.age,
        location: p.location,
        isFeatured: p.isFeatured,
        displayOrder: p.displayOrder,
      },
      create: p,
    });
    createdProfiles.push(profile);
  }
  console.log(`✅ Upserted ${createdProfiles.length} Indian female managed profiles with Google-style initial avatars and no covers.`);

  // 3. Clear community images and posts
  await prisma.postMedia.deleteMany({});
  await prisma.post.deleteMany({});

  // 4. Create Sample Invitations
  const sampleTokens = [
    {
      token: 'VIP-COMMUNITY-2026',
      notes: 'VIP Private Access Pass',
      maxUses: 100,
      currentUses: 0,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
      status: 'ACTIVE',
    },
    {
      token: 'EXECUTIVE-INVITE-01',
      notes: 'Executive Single-Use Pass',
      maxUses: 1,
      currentUses: 0,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      status: 'ACTIVE',
    },
  ];

  for (const inv of sampleTokens) {
    await prisma.invitation.upsert({
      where: { token: inv.token },
      update: {
        maxUses: inv.maxUses,
        status: inv.status,
      },
      create: {
        token: inv.token,
        notes: inv.notes,
        maxUses: inv.maxUses,
        currentUses: inv.currentUses,
        expiresAt: inv.expiresAt,
        status: inv.status,
        createdByUserId: admin.id,
      },
    });
  }
  console.log('✅ Upserted sample invitations.');

  // 5. Default Site Settings
  const defaultSettings = [
    { key: 'site_name', value: 'Dezir Clab' },
    { key: 'site_tagline', value: 'Private Fun & Chat Club' },
    { key: 'registration_mode', value: 'INVITATION_ONLY' },
    { key: 'require_invitation', value: 'true' },
    { key: 'allow_public_directory', value: 'false' },
    { key: 'posts_per_page', value: '20' },
    { key: 'media_upload_max_mb', value: '25' },
    { key: 'enable_direct_messages', value: 'true' },
    { key: 'enable_post_comments', value: 'false' },
    { key: 'maintenance_mode', value: 'false' },
  ];

  for (const setting of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✅ Upserted default site settings.');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
