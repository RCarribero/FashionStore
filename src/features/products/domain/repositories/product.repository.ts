/**
 * Product Repository Interface (Contract)
 * Defines the contract that repository implementations must follow
 * This allows swapping backends without changing the UI layer
 */

import type { Product, ProductFormData, ProductFilters, ProductWithDiscount } from '../../data/models';

export interface IProductRepository {
    /**
     * Get all products with optional filters
     */
    getProducts(filters?: ProductFilters): Promise<{ data: Product[] | null; error: string | null }>;

    /**
     * Get a single product by slug
     */
    getProductBySlug(slug: string): Promise<{ data: Product | null; error: string | null }>;

    /**
     * Get a single product by ID
     */
    getProductById(id: string): Promise<{ data: Product | null; error: string | null }>;

    /**
     * Get products by category
     */
    getProductsByCategory(categorySlug: string): Promise<{ data: Product[] | null; error: string | null }>;

    /**
     * Get featured products for homepage
     */
    getFeaturedProducts(limit?: number): Promise<{ data: Product[] | null; error: string | null }>;

    /**
     * Get products with discount information
     */
    getProductsWithDiscounts(filters?: ProductFilters): Promise<{ data: ProductWithDiscount[] | null; error: string | null }>;

    /**
     * Create a new product (admin)
     */
    createProduct(data: ProductFormData): Promise<{ data: Product | null; error: string | null; success: boolean }>;

    /**
     * Update a product (admin)
     */
    updateProduct(id: string, data: Partial<ProductFormData>): Promise<{ data: Product | null; error: string | null; success: boolean }>;

    /**
     * Delete a product (admin)
     */
    deleteProduct(id: string): Promise<{ error: string | null; success: boolean }>;

    /**
     * Get products with low stock
     */
    getLowStockProducts(threshold?: number): Promise<{ data: Array<{ id: string; name: string; stock: number }> | null; error: string | null }>;
}
