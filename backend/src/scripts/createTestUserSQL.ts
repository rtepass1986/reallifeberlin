import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function main() {
  console.log('Creating test user via SQL...');

  const email = 'rtepass@visioneers.io';
  const password = 'Gottistgut2025!';
  const name = 'Test User';
  const role = 'ADMIN';

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user directly via SQL to bypass Prisma permissions
  const sql = `
    INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
    VALUES (
      'test-' || gen_random_uuid()::text,
      '${email}',
      '${name}',
      '${hashedPassword}',
      '${role}',
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      password = EXCLUDED.password,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      "updatedAt" = NOW();
  `;

  try {
    const { stdout, stderr } = await execAsync(
      `docker-compose exec -T postgres psql -U reallife_user -d reallife_db -c "${sql.replace(/\n/g, ' ').replace(/\s+/g, ' ')}"`,
      { cwd: '/Users/roberttepass/Desktop/Rob_Dev/Reallife_App' }
    );

    if (stderr && !stderr.includes('INSERT')) {
      console.error('Error:', stderr);
      throw new Error(stderr);
    }

    console.log('✅ Test user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', role);
  } catch (error: any) {
    console.error('❌ Error creating user:', error.message);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
