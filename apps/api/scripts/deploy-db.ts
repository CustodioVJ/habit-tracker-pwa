/* eslint-disable no-console */
// Run `prisma migrate deploy` with retries to handle transient
// advisory-lock timeouts (e.g. P1002 on Neon's direct connection).
import { execSync } from 'child_process';

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000;

function runMigrate(): void {
  execSync('npx prisma migrate deploy', {
    cwd: __dirname + '/..',
    env: process.env,
    stdio: 'inherit',
  });
}

let attempt = 1;
for (;;) {
  try {
    runMigrate();
    console.log('prisma migrate deploy succeeded.');
    process.exit(0);
  } catch (err) {
    if (attempt >= MAX_ATTEMPTS) {
      console.error(`prisma migrate deploy failed after ${attempt} attempts.`);
      process.exit(1);
    }
    console.warn(
      `prisma migrate deploy attempt ${attempt} failed. Retrying in ${RETRY_DELAY_MS / 1000}s...`,
    );
    attempt += 1;
    // Synchronous sleep.
    const end = Date.now() + RETRY_DELAY_MS;
    while (Date.now() < end) {
      /* busy-wait */
    }
  }
}
