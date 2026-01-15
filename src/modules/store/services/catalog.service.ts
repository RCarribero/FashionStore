/**
 * Catalog Service
 * Public store catalog operations
 */

import { supabase } from '../../auth';
import type { Product, Category } from '../../../shared/types';

/**
 * Get all products for catalog
 */
export async function getCatalogProducts() {
  return await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .gt('stock', 0)
    .order('created_at', { ascending: false });
}

/**
 * Get products by category
 */
export async function getProductsByCategory(categorySlug: string) {
  return await supabase
    .from('products')
    .select(`
      *,
      category:categories!inner(id, name, slug)
    `)
    .eq('category.slug', categorySlug)
    .order('created_at', { ascending: false });
}

/**
 * Get featured products for homepage
 */
export async function getHomepageFeatured(limit: number = 6) {
  return await supabase
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
 * Get all categories
 */
export async function getCatalogCategories() {
  return await supabase
    .from('categories')
    .select('*')
    .order('name');
}

/**
 * Get all products (for sale/outlet filtering)
 * These will be enriched with discounts by the pages
 */
export async function getAllProductsForSale() {
  return await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .gt('stock', 0)
    .order('created_at', { ascending: false });
}
