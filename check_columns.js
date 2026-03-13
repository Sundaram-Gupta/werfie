const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:root@localhost:5432/xclone_db";

async function checkColumns() {
    const client = new Client({
        connectionString: DATABASE_URL,
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Profile'
        `);

        console.log("Columns in 'Profile' table:");
        res.rows.forEach(row => console.log(` - ${row.column_name}`));

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

checkColumns();
