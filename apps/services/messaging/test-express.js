import express from 'express';
const expressApp = express();
console.log('Checkpoint 1: type of expressApp =', typeof expressApp);
console.log('Checkpoint 2: has all =', !!expressApp.all);
expressApp.all('*', (req, res) => res.send('ok'));
console.log('Success - all() worked');
process.exit(0);
