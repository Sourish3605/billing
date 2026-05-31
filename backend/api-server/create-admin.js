import fs from 'fs';
import { Client } from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

(async () => {
  try {
    const dbLocalPath = path.resolve(fileURLToPath(import.meta.url), '../../db/DATABASE_URL.local');
    const dbUrl = fs.readFileSync(dbLocalPath, 'utf8').trim();

    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    const username = 'admin';
    const password = 'password';
    await client.query(`CREATE TABLE IF NOT EXISTS admin (id serial PRIMARY KEY, username text UNIQUE NOT NULL, password text NOT NULL)`);
    await client.query(`INSERT INTO admin (username, password) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password`, [username, password]);
    console.log('Admin user inserted/updated: admin / password');
    await client.end();
  } catch (err) {
    console.error('Failed to create admin:', err);
    process.exitCode = 1;
  }
})();
