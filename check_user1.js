const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:12345678@localhost:5432/xclone_db";

async function checkUser1() {
    const client = new Client({
        connectionString: DATABASE_URL,
    });

    try {
        await client.connect();
        const res = await client.query("SELECT email FROM \"User\" WHERE email = 'user1@xclone.com'");
        if (res.rows.length > 0) {
            console.log("User 'user1@xclone.com' found.");
        } else {
            console.log("User 'user1@xclone.com' NOT found.");
            // List some users to see what's actually there
            const allUsers = await client.query("SELECT email FROM \"User\" LIMIT 10");
            console.log("Actual users in DB:", allUsers.rows.map(r => r.email));
        }
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

checkUser1();
