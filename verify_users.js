async function checkUsers() {
    try {
        const res = await fetch('http://localhost:3001/api/users/suggestions?limit=12');
        const users = await res.json();

        console.log('--- User Verification Report ---');
        console.log(`Users found in suggestions: ${users.length}`);

        const seededUsers = users.filter(u => u.profile?.handle && u.profile.handle.includes('user_seed'));
        console.log(`Seeded users found: ${seededUsers.length}`);

        if (seededUsers.length > 0) {
            console.log('Sample Seeded Users:');
            seededUsers.slice(0, 3).forEach(u => {
                console.log(`- ${u.profile.name} (@${u.profile.handle})`);
            });
        }
    } catch (e) {
        console.error('User verification failed:', e.message);
    }
}
checkUsers();
