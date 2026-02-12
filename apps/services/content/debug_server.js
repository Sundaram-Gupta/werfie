
// Wrapper to run content service on different port for debugging logs
process.env.PORT = 3033;
process.env.JWT_SECRET = 'dev-secret';
require('./src/index.js');
