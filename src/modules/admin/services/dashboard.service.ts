/**
 * Dashboard Service
 * Statistics and metrics for admin dashboard
 */

import { supabase } from '../../auth';
import type { DashboardStats } from '../../../shared/types';
import { ADMIN_CONFIG } from '../config';

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    // Get product count
    const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

    // Get category count
    const { count: categoryCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

    // Get all products for calculations
    const { data: products } = await supabase
        .from('products')
        .select('price, stock, featured');

    const totalStock = products?.reduce((sum, p) => sum + p.stock, 0) || 0;
    const totalValue = products?.reduce((sum, p) => sum + (p.price * p.stock), 0) || 0;
    const featuredCount = products?.filter(p => p.featured).length || 0;
    const outOfStockCount = products?.filter(p => p.stock === 0).length || 0;
    const lowStockCount = products?.filter(p => p.stock > 0 && p.stock < ADMIN_CONFIG.dashboard.lowStockThreshold).length || 0;

    return {
        productCount: productCount || 0,
        categoryCount: categoryCount || 0,
        totalStock,
        totalValue,
        lowStockCount,
        outOfStockCount,
        featuredCount,
    };
}

/**
 * Get recent products
 */
export async function getRecentProducts(limit: number = ADMIN_CONFIG.dashboard.recentProductsLimit) {
    return await supabase
        .from('products')
        .select(`
      id, name, price, stock, images, created_at,
      category:categories(name)
    `)
        .order('created_at', { ascending: false })
        .limit(limit);
}

/**
 * Get products by category for chart
 */
export async function getProductsByCategory() {
    const { data: categories } = await supabase
        .from('categories')
        .select('id, name');

    const { data: products } = await supabase
        .from('products')
        .select('category_id');

    return categories?.map(cat => ({
        name: cat.name,
        count: products?.filter(p => p.category_id === cat.id).length || 0,
    })) || [];
}
