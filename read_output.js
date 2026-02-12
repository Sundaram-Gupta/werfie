const fs = require('fs');
try {
    const content = fs.readFileSync('upload_output.txt', 'utf8'); // Try utf8 first
    console.log('CONTENT START');
    console.log(content);
    console.log('CONTENT END');
} catch (e) {
    // Try reading as buffer and converting
    const buf = fs.readFileSync('upload_output.txt');
    console.log('CONTENT BINARY START');
    console.log(buf.toString('utf16le')); // Powershell often uses utf16le
    console.log('CONTENT BINARY END');
}
