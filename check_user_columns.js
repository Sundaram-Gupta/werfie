const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:12345678@localhost:5432/xclone_db";

async function checkUserColumns() {
    const client = new Client({
        connectionString: DATABASE_URL,
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'User';
        `);
        console.log("Columns in User table:");
        res.rows.forEach(row => {
            console.log(`${row.column_name} (${row.data_type})`);
        });
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

checkUserColumns();
