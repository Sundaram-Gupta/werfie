const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:12345678@localhost:5432/xclone_db";

async function checkDb() {
    const client = new Client({
        connectionString: DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("Connected to database successfully.");

        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        console.log("Tables in 'public' schema:");
        res.rows.forEach(row => console.log(` - ${row.table_name}`));

    } catch (err) {
        console.error("Database connection error:", err.message);
    } finally {
        await client.end();
    }
}

checkDb();
