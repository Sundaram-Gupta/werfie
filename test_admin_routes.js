async function test() {
    try {
        const res = await fetch('http://localhost:3012/api/admin/users');
        console.log('Users Status:', res.status);
    } catch (e) {
        console.log('Users Error:', e.message);
    }

    try {
        const res = await fetch('http://localhost:3012/api/admin/config/api-keys');
        console.log('Config Status:', res.status);
    } catch (e) {
        console.log('Config Error:', e.message);
    }
}
test();
