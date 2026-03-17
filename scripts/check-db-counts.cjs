const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db';

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    const users = await client.query('SELECT COUNT(*) FROM "User"');
    const posts = await client.query('SELECT COUNT(*) FROM "Post"');
    console.log('Users:', users.rows[0].count);
    console.log('Posts:', posts.rows[0].count);
    process.exit(0);
  } catch (err) {
    console.error('DB check failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
