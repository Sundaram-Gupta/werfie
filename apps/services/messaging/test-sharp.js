import sharp from 'sharp';
import fs from 'fs';

async function test() {
    console.log("Testing Sharp...");
    try {
        const image = sharp({
            create: {
                width: 100,
                height: 100,
                channels: 4,
                background: { r: 255, g: 0, b: 0, alpha: 0.5 }
            }
        });

        await image.webp().toFile('test-output.webp');
        console.log("✅ Sharp is working! Created test-output.webp");
        fs.unlinkSync('test-output.webp');
    } catch (error) {
        console.error("❌ Sharp failed:", error);
    }
}

test();
