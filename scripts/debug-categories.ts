// Debug script to check products and categories
import { createAdminClient } from '../src/modules/auth/services/auth.service';

const supabase = createAdminClient();

// Check categories
console.log('\n=== CATEGORIES ===');
const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*');

console.log('Categories:', categories);
console.log('Error:', catError);

// Check all products (no filter)
console.log('\n=== ALL PRODUCTS ===');
const { data: allProducts, error: allError } = await supabase
    .from('products')
    .select('*')
    .limit(3);

console.log('Sample products:', allProducts);
console.log('Error:', allError);

// Check products with category filter
if (categories && categories.length > 0) {
    const firstCat = categories[0];
    console.log(`\n=== PRODUCTS IN CATEGORY: ${firstCat.name} (${firstCat.id}) ===`);

    const { data: catProducts, error: catProdError } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', firstCat.id);

    console.log('Products:', catProducts);
    console.log('Error:', catProdError);
}

console.log('\n=== DONE ===');
