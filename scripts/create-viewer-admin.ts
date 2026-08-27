import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const emailArg = args[0] || 'viewer@community.vip';
  const passArg = args[1] || 'ViewerSecret2026!';
  const firstNameArg = args[2] || 'Auditor';
  const lastNameArg = args[3] || 'Observer';

  console.log('====================================================');
  console.log('👁️ DEZIR CLAB — VIEWER / AUDITOR ADMIN SETUP');
  console.log('====================================================\n');

  console.log(`Target Email     : ${emailArg}`);
  console.log(`Role             : VIEWER_ADMIN (Read-Only)`);
  console.log(`Setting Password : ${passArg.replace(/./g, '•')}`);

  if (passArg.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(passArg, 10);

  // Find existing viewer admin or create one
  let viewer = await prisma.user.findFirst({
    where: { email: emailArg.toLowerCase().trim() },
  });

  if (viewer) {
    viewer = await prisma.user.update({
      where: { id: viewer.id },
      data: {
        email: emailArg.toLowerCase().trim(),
        passwordHash,
        role: 'VIEWER_ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log(`\n✅ SUCCESS: Viewer Admin credentials updated in database.`);
  } else {
    viewer = await prisma.user.create({
      data: {
        email: emailArg.toLowerCase().trim(),
        passwordHash,
        firstName: firstNameArg,
        lastName: lastNameArg,
        role: 'VIEWER_ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log(`\n✅ SUCCESS: Created new Viewer Admin (Read-Only) account in database.`);
  }

  console.log(`\nViewer Admin ID : ${viewer.id}`);
  console.log(`Viewer Email    : ${viewer.email}`);
  console.log(`Viewer Role     : ${viewer.role} (Can view everything, cannot post or chat)`);
  console.log(`Login Portal    : http://localhost:3000/likecrazy/login\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Fatal error creating viewer admin:', e);
  process.exit(1);
});
