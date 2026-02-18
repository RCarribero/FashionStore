/**
 * Product Remote Datasource
 * Direct calls to Supabase for product data
 */

import { createClient } from '@supabase/supabase-js';
import type { Product, ProductFormData, ProductFilters } from '../models';
import { createAdminClient } from '../../../../modules/auth';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

const adminClient = () => {
    if (typeof window !== 'undefined') {
        throw new Error('Admin datasource is server-only');
    }
    return createAdminClient();
};

/**
 * Fetch all products with optional category info
 */
export async function fetchProducts(filters?: ProductFilters) {
    let query = supabase
        .from('products')
        .select(`
            *,
            category:categories(id, name, slug)
        `)
        .order('created_at', { ascending: false });

    if (filters?.inStock !== false) {
        query = query.gt('stock', 0);
    }

    if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.featured) {
        query = query.eq('featured', true);
    }

    if (filters?.minPrice) {
        query = query.gte('price', filters.minPrice);
    }

    if (filters?.maxPrice) {
        query = query.lte('price', filters.maxPrice);
    }

    return query;
}

/**
 * Fetch single product by slug
 */
export async function fetchProductBySlug(slug: string) {
    return supabase
        .from('products')
        .select(`
            *,
            category:categories(id, name, slug)
        `)
        .eq('slug', slug)
        .single();
}

/**
 * Fetch single product by ID
 */
export async function fetchProductById(id: string) {
    return supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
}

/**
 * Fetch products by category slug
 */
export async function fetchProductsByCategory(categorySlug: string) {
    return supabase
        .from('products')
        .select(`
            *,
            category:categories!inner(id, name, slug)
        `)
        .eq('category.slug', categorySlug)
        .gt('stock', 0)
        .order('created_at', { ascending: false });
}

/**
 * Fetch featured products
 */
export async function fetchFeaturedProducts(limit: number = 6) {
    return supabase
        .from('products')
        .select(`
            *,
            category:categories(id, name, slug)
        `)
        .eq('featured', true)
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(limit);
}

/**
 * Insert new product (admin)
 */
export async function insertProduct(data: ProductFormData) {
    return adminClient()
        .from('products')
        .insert({
            name: data.name,
            slug: data.name.toLowerCase().replace(/\s+/g, '-'),
            description: data.description,
            price: Math.round(data.price * 100),
            stock: data.stock,
            category_id: data.category_id,
            images: data.images,
            featured: data.featured,
        })
        .select()
        .single();
}

/**
 * Update product (admin)
 */
export async function updateProductData(id: string, data: Partial<ProductFormData>) {
    const updateData: Record<string, unknown> = {
        ...data,
        updated_at: new Date().toISOString(),
    };

    if (data.name) {
        updateData.slug = data.name.toLowerCase().replace(/\s+/g, '-');
    }

    if (data.price !== undefined) {
        updateData.price = Math.round(data.price * 100);
    }

    return adminClient()
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
}

/**
 * Delete product (admin)
 */
export async function deleteProductData(id: string) {
    return adminClient()
        .from('products')
        .delete()
        .eq('id', id);
}

/**
 * Fetch low stock products
 */
export async function fetchLowStockProducts(threshold: number = 5) {
    return supabase
        .from('products')
        .select('id, name, stock')
        .lt('stock', threshold)
        .order('stock')
        .limit(5);
}
