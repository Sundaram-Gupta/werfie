const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:12345678@localhost:5432/xclone_db";

async function checkNotifications() {
    const client = new Client({
        connectionString: DATABASE_URL,
    });

    try {
        await client.connect();

        // Find a user who has notifications
        const res = await client.query(`
            SELECT "User".email, count("Notification".id) as count, "User".id
            FROM "Notification"
            JOIN "User" ON "Notification"."userId" = "User".id
            GROUP BY "User".email, "User".id
            ORDER BY count DESC
            LIMIT 1
        `);

        if (res.rows.length > 0) {
            console.log("User with notifications:", res.rows[0]);
        } else {
            console.log("No notifications found in DB.");
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

checkNotifications();
