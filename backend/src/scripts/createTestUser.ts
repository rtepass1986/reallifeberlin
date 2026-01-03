import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test user...');

  const email = 'rtepass@visioneers.io';
  const password = 'Gottistgut2025!';
  const name = 'Test User';
  const role = 'ADMIN'; // Give admin access for testing

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        name,
        role
      },
      create: {
        email,
        password: hashedPassword,
        name,
        role
      }
    });

    console.log('✅ Test user created successfully!');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Password: Gottistgut2025!');
  } catch (error: any) {
    console.error('❌ Error creating user:', error.message);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
