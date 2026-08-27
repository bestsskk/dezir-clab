import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const emailArg = args[0] || process.env.ADMIN_EMAIL || 'admin@community.vip';
  const passArg = args[1] || process.env.ADMIN_PASSWORD || 'AdminSecret2026!';

  console.log('====================================================');
  console.log('🔐 DEZIR CLAB — ADMIN CREDENTIALS CONFIGURATOR');
  console.log('====================================================\n');

  console.log(`Target Admin Email   : ${emailArg}`);
  console.log(`Setting New Password : ${passArg.replace(/./g, '•')}`);

  if (passArg.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(passArg, 10);

  // Find existing admin or create one
  let admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (admin) {
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: {
        email: emailArg.toLowerCase().trim(),
        passwordHash,
        status: 'ACTIVE',
      },
    });
    console.log(`\n✅ SUCCESS: Admin credentials updated in database.`);
  } else {
    admin = await prisma.user.create({
      data: {
        email: emailArg.toLowerCase().trim(),
        passwordHash,
        firstName: 'Executive',
        lastName: 'Director',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log(`\n✅ SUCCESS: Created new Administrator account in database.`);
  }

  console.log(`\nAdmin ID     : ${admin.id}`);
  console.log(`Admin Email  : ${admin.email}`);
  console.log(`Admin Role   : ${admin.role}`);
  console.log(`Admin Portal : http://localhost:3000/likecrazy/login\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Fatal error updating credentials:', e);
  process.exit(1);
});
