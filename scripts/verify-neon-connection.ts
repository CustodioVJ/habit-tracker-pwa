/**
 * Verify the Neon database connection by executing SELECT 1.
 * Reads DATABASE_URL from the project's .env.local file.
 */
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local from the project root
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error(`❌ .env.local not found at ${envPath}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();
  // Strip surrounding quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  envVars[key] = value;
}

const databaseUrl = envVars['DATABASE_URL'];
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

async function main() {
  console.log('🔌 Connecting to Neon database...');
  const sql = neon(databaseUrl);

  try {
    const result = await sql`SELECT 1 as ok`;
    console.log('✅ Connection successful!');
    console.log('   SELECT 1 result:', JSON.stringify(result));

    // Also check if the tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('📋 Tables in database:', tables.map((t: any) => t.table_name).join(', ') || '(none)');
  } catch (err) {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  }
}

main();
