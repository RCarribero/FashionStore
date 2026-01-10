/**
 * Category Service
 * Category CRUD operations for admin
 */

import { supabase, createAdminClient } from '../../auth';
import { slugify } from '../../../shared/utils';
import type { Category, ApiResponse } from '../../../shared/types';

/**
 * Get all categories
 */
export async function getCategories() {
    return await supabase
        .from('categories')
        .select('*')
        .order('name');
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string) {
    return await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();
}

/**
 * Create category (admin only)
 */
export async function createCategory(name: string): Promise<ApiResponse<Category>> {
    try {
        const adminClient = createAdminClient();

        const { data: category, error } = await adminClient
            .from('categories')
            .insert({
                name,
                slug: slugify(name),
            })
            .select()
            .single();

        if (error) {
            return { error: error.message, success: false };
        }

        return { data: category, success: true };
    } catch (e) {
        return { error: 'Error creating category', success: false };
    }
}

/**
 * Delete category (admin only)
 */
export async function deleteCategory(id: string): Promise<ApiResponse> {
    try {
        const adminClient = createAdminClient();

        const { error } = await adminClient
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            return { error: error.message, success: false };
        }

        return { success: true };
    } catch (e) {
        return { error: 'Error deleting category', success: false };
    }
}

/**
 * Get product count per category
 */
export async function getProductCountByCategory() {
    const { data: products } = await supabase
        .from('products')
        .select('category_id');

    const countByCategory: Record<string, number> = {};
    products?.forEach(p => {
        if (p.category_id) {
            countByCategory[p.category_id] = (countByCategory[p.category_id] || 0) + 1;
        }
    });

    return countByCategory;
}
