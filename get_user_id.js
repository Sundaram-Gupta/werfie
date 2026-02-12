const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:12345678@localhost:5432/xclone_db";

async function getUserId() {
    const client = new Client({
        connectionString: DATABASE_URL,
    });

    try {
        await client.connect();
        const res = await client.query("SELECT id FROM \"User\" WHERE email = 'user1@xclone.com'");
        if (res.rows.length > 0) {
            console.log("ID for user1@xclone.com:", res.rows[0].id);
        } else {
            console.log("User not found.");
        }
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

getUserId();
