
import { createAdminClient } from '../modules/auth/services/auth.service';

async function listCategories() {
    const supabase = createAdminClient();
    const { data: categories, error } = await supabase
        .from('categories')
        .select('id, name, slug');

    if (error) {
        console.error('Error fetching categories:', error);
    } else {
        console.log('Categories in DB:', categories);
    }
}

listCategories();
