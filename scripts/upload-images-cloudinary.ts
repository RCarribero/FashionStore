/**
 * Upload AI-Generated Images to Cloudinary
 */
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const artifactDir = 'C:/Users/RBX/.gemini/antigravity/brain/1d075cd6-fc1c-49cf-9f7c-54c1359f7024';

const imageFiles = [
    { file: 'urbanstride_runner_1768291383787.png', public_id: 'fashionstore/urbanstride-runner-pro' },
    { file: 'cloudstep_casual_1768291399128.png', public_id: 'fashionstore/cloudstep-casual-white' },
    { file: 'flexmotion_trainer_1768291413641.png', public_id: 'fashionstore/flexmotion-training-elite' },
    { file: 'streetstyle_high_1768291427714.png', public_id: 'fashionstore/streetstyle-high-classic' },
    { file: 'techware_hoodie_black_1768291441248.png', public_id: 'fashionstore/techwear-pro-hoodie' },
    { file: 'comfort_fleece_grey_1768291454960.png', public_id: 'fashionstore/comfort-fleece-grey' },
    { file: 'athletic_joggers_black_1768291467050.png', public_id: 'fashionstore/athletic-joggers-black' },
    { file: 'essential_tee_white_1768291481766.png', public_id: 'fashionstore/essential-tee-white' },
    { file: 'urbanstride_classic_white_1768291494780.png', public_id: 'fashionstore/urbanstride-classic-white' },
    { file: 'retro_court_sneaker_1768291508676.png', public_id: 'fashionstore/retro-court-burgundy' }
];

const uploadedUrls: Record<string, string> = {};

console.log('Uploading images to Cloudinary...\n');

for (const { file, public_id } of imageFiles) {
    const filePath = `${artifactDir}/${file}`;

    if (!fs.existsSync(filePath)) {
        console.log(`  ✗ File not found: ${file}`);
        continue;
    }

    try {
        console.log(`  → Uploading ${file}...`);

        const result = await cloudinary.uploader.upload(filePath, {
            public_id: public_id,
            folder: 'fashionstore',
            format: 'webp',
            transformation: [
                { width: 800, height: 800, crop: 'fill', quality: 'auto:good' }
            ]
        });

        uploadedUrls[public_id] = result.secure_url;
        console.log(`    ✓ Uploaded: ${result.secure_url}`);

    } catch (error) {
        console.error(`    ✗ Error uploading ${file}:`, error);
    }
}

console.log('\n✓ Upload complete!');
console.log(`\nUploaded ${Object.keys(uploadedUrls).length}/${imageFiles.length} images`);

// Save URLs to a JSON file for reference
fs.writeFileSync(
    'cloudinary-urls.json',
    JSON.stringify(uploadedUrls, null, 2)
);

console.log('\nURLs saved to cloudinary-urls.json');
