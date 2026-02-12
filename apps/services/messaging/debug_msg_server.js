
// Wrapper to run messaging service on different port for debugging
process.env.PORT = 3049;
process.env.JWT_SECRET = 'dev-secret';
// Mock R2 envs to avoid crash if they are needed at startup
process.env.R2_ACCOUNT_ID = 'mock';
process.env.R2_ACCESS_KEY_ID = 'mock';
process.env.R2_SECRET_ACCESS_KEY = 'mock';
process.env.R2_BUCKET_NAME = 'mock';
process.env.R2_PUBLIC_DOMAIN = 'mock';

import fs from 'fs';

try {
    import('./server.js').catch(err => {
        console.error(err);
        fs.writeFileSync('debug_error.log', err.stack || err.message);
    });
} catch (err) {
    console.error(err);
    fs.writeFileSync('debug_error.log', err.stack || err.message);
}
