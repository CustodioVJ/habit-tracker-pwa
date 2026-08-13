/* eslint-disable no-console */
// Drop all tables in the Neon database and recreate them from the Prisma migrations.
// Uses the direct (unpooled) connection to avoid advisory-lock timeouts.
import { execSync } from 'child_process';

const unpooled = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!unpooled) {
  console.error(
    'DATABASE_URL_UNPOOLED or DATABASE_URL must be set in the environment.',
  );
  process.exit(1);
}

function run(cmd: string): void {
  console.log(`\n> ${cmd}`);
  execSync(cmd, {
    cwd: __dirname + '/..',
    env: { ...process.env, DATABASE_URL: unpooled },
    stdio: 'inherit',
  });
}

// 1. Drop the entire public schema (all tables, indexes, constraints).
console.log('Dropping all tables in the public schema...');
run(
  'npx prisma db execute --url "' +
    unpooled +
    '" --file scripts/drop-schema.sql',
);

// 2. Recreate all tables from the Prisma migrations.
console.log('Recreating all tables from migrations...');
run('npx prisma migrate deploy');

console.log('\nDatabase reset complete.');
