/**
 * Upload Category Images to Cloudinary
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
    { file: 'category_zapatillas_1768292561837.png', public_id: 'fashionstore/categories/zapatillas' },
    { file: 'category_sudaderas_1768292575718.png', public_id: 'fashionstore/categories/sudaderas' },
    { file: 'category_pantalones_1768292589879.png', public_id: 'fashionstore/categories/pantalones' },
    { file: 'category_camisetas_1768292606881.png', public_id: 'fashionstore/categories/camisetas' }
];

const uploadedUrls: Record<string, string> = {};

console.log('Uploading category images to Cloudinary...\n');

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
            format: 'webp',
            transformation: [
                { width: 1200, height: 800, crop: 'fill', quality: 'auto:good' }
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

// Save URLs
fs.writeFileSync(
    'cloudinary-category-urls.json',
    JSON.stringify(uploadedUrls, null, 2)
);

console.log('\nURLs saved to cloudinary-category-urls.json');
