/**
 * Upload Images Script
 * Uploads product images to Supabase Storage and updates products
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
    'https://dixaynqqloclazirzgik.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeGF5bnFxbG9jbGF6aXJ6Z2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg3MDAzNSwiZXhwIjoyMDgzNDQ2MDM1fQ.Z-PYZ2z6uji0pKz8ocSYqqehIJHlTLNrpkpBrtf9vRQ'
);

const IMAGES_DIR = 'C:/Users/RBX/.gemini/antigravity/brain/7fea5eb9-eb09-453c-a0db-7e8584789331';

const productImages: { [slug: string]: string } = {
    'camisa-oxford-azul-marino': 'camisa_oxford_azul_1767947971871.png',
    'camisa-lino-blanca': 'camisa_lino_blanca_1767947987560.png',
    'pantalon-chino-arena': 'pantalon_chino_beige_1767948004088.png',
    'traje-azul-marino-slim': 'traje_azul_marino_1767948030519.png',
    'polo-premium-negro': 'polo_negro_1767948044423.png',
    'pantalon-de-vestir-gris': 'pantalon_vestir_gris_1767948059596.png',
};

async function uploadImages() {
    console.log('Uploading images to Supabase Storage...\n');

    for (const [slug, imageName] of Object.entries(productImages)) {
        try {
            const imagePath = path.join(IMAGES_DIR, imageName);

            if (!fs.existsSync(imagePath)) {
                console.log(`Image not found: ${imagePath}`);
                continue;
            }

            const fileBuffer = fs.readFileSync(imagePath);
            const fileName = `${slug}.png`;

            // Upload to Storage
            console.log(`Uploading ${fileName}...`);
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, fileBuffer, {
                    contentType: 'image/png',
                    upsert: true,
                });

            if (uploadError) {
                console.error(`  Upload error: ${uploadError.message}`);
                continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            const imageUrl = urlData.publicUrl;
            console.log(`  URL: ${imageUrl}`);

            // Update product in database
            const { error: updateError } = await supabase
                .from('products')
                .update({ images: [imageUrl] })
                .eq('slug', slug);

            if (updateError) {
                console.error(`  Update error: ${updateError.message}`);
            } else {
                console.log(`  Updated product: ${slug}`);
            }

            console.log('');
        } catch (err) {
            console.error(`Error processing ${slug}:`, err);
        }
    }

    console.log('Upload complete!');
}

uploadImages();
