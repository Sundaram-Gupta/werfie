const { Client } = require('pg');

async function checkConn(url) {
    console.log(`Checking connection to: ${url}`);
    const client = new Client({ connectionString: url });
    try {
        await client.connect();
        console.log(`✅ Success for ${url}`);
        const res = await client.query('SELECT current_database(), current_user, version()');
        console.log('Details:', res.rows[0]);
        await client.end();
        return true;
    } catch (err) {
        console.error(`❌ Failed for ${url}:`, err.message);
        return false;
    }
}

async function main() {
    const urls = [
        "postgresql://postgres:root@localhost:5432/xclone_db",
        "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db"
    ];
    for (const url of urls) {
        await checkConn(url);
    }
}

main();
