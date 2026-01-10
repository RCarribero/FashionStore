/**
 * Product Service
 * Product CRUD operations for admin
 */

import { supabase, createAdminClient } from '../../auth';
import { slugify } from '../../../shared/utils';
import type { Product, ProductFormData, ApiResponse } from '../../../shared/types';

/**
 * Get all products with category info
 */
export async function getProducts() {
    return await supabase
        .from('products')
        .select(`
      *,
      category:categories(id, name, slug)
    `)
        .order('created_at', { ascending: false });
}

/**
 * Get product by ID
 */
export async function getProductById(id: string) {
    return await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
}

/**
 * Get product by slug
 */
export async function getProductBySlug(slug: string) {
    return await supabase
        .from('products')
        .select(`
      *,
      category:categories(id, name, slug)
    `)
        .eq('slug', slug)
        .single();
}

/**
 * Create new product (admin only)
 */
export async function createProduct(data: ProductFormData): Promise<ApiResponse<Product>> {
    try {
        const adminClient = createAdminClient();

        const { data: product, error } = await adminClient
            .from('products')
            .insert({
                name: data.name,
                slug: slugify(data.name),
                description: data.description,
                price: Math.round(data.price * 100), // Convert to cents
                stock: data.stock,
                category_id: data.category_id || null,
                images: data.images,
                featured: data.featured,
            })
            .select()
            .single();

        if (error) {
            return { error: error.message, success: false };
        }

        return { data: product, success: true };
    } catch (e) {
        return { error: 'Error creating product', success: false };
    }
}

/**
 * Update product (admin only)
 */
export async function updateProduct(id: string, data: Partial<ProductFormData>): Promise<ApiResponse<Product>> {
    try {
        const adminClient = createAdminClient();

        const updateData: Record<string, unknown> = {
            ...data,
            updated_at: new Date().toISOString(),
        };

        if (data.name) {
            updateData.slug = slugify(data.name);
        }

        if (data.price !== undefined) {
            updateData.price = Math.round(data.price * 100);
        }

        const { data: product, error } = await adminClient
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return { error: error.message, success: false };
        }

        return { data: product, success: true };
    } catch (e) {
        return { error: 'Error updating product', success: false };
    }
}

/**
 * Delete product (admin only)
 */
export async function deleteProduct(id: string): Promise<ApiResponse> {
    try {
        const adminClient = createAdminClient();

        const { error } = await adminClient
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            return { error: error.message, success: false };
        }

        return { success: true };
    } catch (e) {
        return { error: 'Error deleting product', success: false };
    }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(threshold: number = 5) {
    return await supabase
        .from('products')
        .select('id, name, stock')
        .lt('stock', threshold)
        .order('stock')
        .limit(5);
}

/**
 * Get featured products
 */
export async function getFeaturedProducts() {
    return await supabase
        .from('products')
        .select(`
      *,
      category:categories(id, name, slug)
    `)
        .eq('featured', true)
        .order('created_at', { ascending: false });
}
