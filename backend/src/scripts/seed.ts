import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@reallife.church' },
    update: {},
    create: {
      email: 'admin@reallife.church',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });
  console.log('Created admin user:', admin.email);

  // Create test user
  const testPassword = await bcrypt.hash('test123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@reallife.church' },
    update: {},
    create: {
      email: 'test@reallife.church',
      password: testPassword,
      name: 'Test User',
      role: 'CONNECTOR'
    }
  });
  console.log('Created test user:', testUser.email);
  console.log('Test user credentials:');
  console.log('  Email: test@reallife.church');
  console.log('  Password: test123');

  // Create mission points
  const missionPoints = [
    {
      name: 'Wir gehen',
      description: 'Mission point for outreach and evangelism',
      order: 1
    },
    {
      name: 'Wir bringen',
      description: 'Mission point for bringing people to church',
      order: 2
    },
    {
      name: 'Wir begleiten',
      description: 'Mission point for discipleship and growth',
      order: 3
    }
  ];

  for (const mp of missionPoints) {
    const missionPoint = await prisma.missionPoint.upsert({
      where: { name: mp.name },
      update: {},
      create: mp
    });
    console.log(`Created mission point: ${missionPoint.name}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
