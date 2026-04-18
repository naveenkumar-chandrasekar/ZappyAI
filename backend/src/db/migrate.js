import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('Running migrations...');

  try {
    for (const file of ['001_init.sql', '002_owner_person.sql', '003_task_status.sql', '004_task_status_v2.sql']) {
      const sql = readFileSync(join(__dirname, 'migrations', file), 'utf8');
      await client.query(sql);
      console.log(`Migration ${file} completed successfully.`);
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
