/**
 * Database Cleanup Script
 * Removes all existing products and variants
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log('Starting database cleanup...\n');

// Delete all product variants first (foreign key constraint)
console.log('Deleting product variants...');
const { error: variantsError } = await supabase
    .from('product_variants')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

if (variantsError) {
    console.error('Error deleting variants:', variantsError);
} else {
    console.log('✓ All product variants deleted');
}

// Delete all products
console.log('Deleting products...');
const { error: productsError } = await supabase
    .from('products')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

if (productsError) {
    console.error('Error deleting products:', productsError);
} else {
    console.log('✓ All products deleted');
}

console.log('\nCleanup complete!');
