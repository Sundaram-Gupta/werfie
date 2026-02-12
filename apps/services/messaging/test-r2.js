import { uploadToR2 } from './lib/r2.js';
import fs from 'fs';

async function test() {
    console.log("Testing R2 Upload...");
    try {
        // Create a dummy file
        fs.writeFileSync('test-upload.txt', 'Hello R2');
        const buffer = fs.readFileSync('test-upload.txt');

        const url = await uploadToR2(buffer, 'text/plain', 'test-folder');
        console.log("✅ R2 Upload Success:", url);

        fs.unlinkSync('test-upload.txt');
    } catch (error) {
        console.error("❌ R2 Upload Failed:", error);
    }
}

test();
