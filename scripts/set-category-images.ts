/**
 * Script to set category images in the database
 * Run with: npx astro run scripts/set-category-images.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const categoryImages: Record<string, string> = {
    'zapatillas': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292616/fashionstore/categories/zapatillas.webp',
    'sudaderas': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292618/fashionstore/categories/sudaderas.webp',
    'pantalones': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292619/fashionstore/categories/pantalones.webp',
    'camisetas': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292621/fashionstore/categories/camisetas.webp',
    'chaquetas': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292621/fashionstore/categories/chaquetas.webp'
};

async function setCategoryImages() {
    console.log('Setting category images...');

    for (const [slug, imageUrl] of Object.entries(categoryImages)) {
        const { error } = await supabase
            .from('categories')
            .update({ image: imageUrl })
            .eq('slug', slug)
            .is('image', null); // Only update if image is not set

        if (error) {
            console.error(`Error updating ${slug}:`, error.message);
        } else {
            console.log(`Updated ${slug} with image`);
        }
    }

    console.log('Done!');
}

setCategoryImages();
