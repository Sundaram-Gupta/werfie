const fs = require('fs');

const API_URL = 'http://127.0.0.1:3001/api';

async function createUsers() {
    const content = fs.readFileSync('userpassword.md', 'utf8');
    const lines = content.split('\n');
    const users = [];

    for (const line of lines) {
        const match = line.match(/\| @(\w+) \| ([\w@.]+) \| ([\w]+) \|/);
        if (match) {
            users.push({
                handle: match[1],
                email: match[2],
                password: match[3],
                name: match[1].charAt(0).toUpperCase() + match[1].slice(1)
            });
        }
    }

    console.log(`Found ${users.length} users to create.`);

    for (const user of users) {
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });

            if (res.ok) {
                console.log(`Successfully created user: ${user.handle}`);
            } else {
                const error = await res.text();
                console.error(`Failed to create user ${user.handle}:`, error);
            }
        } catch (err) {
            console.error(`Error creating user ${user.handle}:`, err.message);
        }
    }
}

createUsers();
