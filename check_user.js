const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:12345678@localhost:5432/xclone_db";

async function checkUser() {
    const client = new Client({
        connectionString: DATABASE_URL,
    });

    try {
        await client.connect();
        const res = await client.query("SELECT email FROM \"User\" WHERE email = 'test2@gmail.com'");
        if (res.rows.length > 0) {
            console.log("User 'test2@gmail.com' found.");
        } else {
            console.log("User 'test2@gmail.com' NOT found. You might need to register first.");

            // List some users if any
            const allUsers = await client.query("SELECT email FROM \"User\" LIMIT 5");
            console.log("Existing users:", allUsers.rows.map(r => r.email));
        }
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

checkUser();
