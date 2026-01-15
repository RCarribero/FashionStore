/**
 * Product Repository Implementation
 * Implements the repository interface using the datasource
 */

import type { IProductRepository } from '../../domain/repositories';
import type { Product, ProductFormData, ProductFilters, ProductWithDiscount } from '../models';
import * as datasource from '../datasources/product.datasource';
import { enrichProductsWithDiscounts } from '@/shared/services';

export class ProductRepositoryImpl implements IProductRepository {

    async getProducts(filters?: ProductFilters): Promise<{ data: Product[] | null; error: string | null }> {
        const { data, error } = await datasource.fetchProducts(filters);
        return { data, error: error?.message ?? null };
    }

    async getProductBySlug(slug: string): Promise<{ data: Product | null; error: string | null }> {
        const { data, error } = await datasource.fetchProductBySlug(slug);
        return { data, error: error?.message ?? null };
    }

    async getProductById(id: string): Promise<{ data: Product | null; error: string | null }> {
        const { data, error } = await datasource.fetchProductById(id);
        return { data, error: error?.message ?? null };
    }

    async getProductsByCategory(categorySlug: string): Promise<{ data: Product[] | null; error: string | null }> {
        const { data, error } = await datasource.fetchProductsByCategory(categorySlug);
        return { data, error: error?.message ?? null };
    }

    async getFeaturedProducts(limit: number = 6): Promise<{ data: Product[] | null; error: string | null }> {
        const { data, error } = await datasource.fetchFeaturedProducts(limit);
        return { data, error: error?.message ?? null };
    }

    async getProductsWithDiscounts(filters?: ProductFilters): Promise<{ data: ProductWithDiscount[] | null; error: string | null }> {
        const { data, error } = await datasource.fetchProducts(filters);
        if (error || !data) {
            return { data: null, error: error?.message ?? null };
        }
        const enriched = await enrichProductsWithDiscounts(data);
        return { data: enriched, error: null };
    }

    async createProduct(data: ProductFormData): Promise<{ data: Product | null; error: string | null; success: boolean }> {
        const { data: product, error } = await datasource.insertProduct(data);
        return {
            data: product,
            error: error?.message ?? null,
            success: !error
        };
    }

    async updateProduct(id: string, data: Partial<ProductFormData>): Promise<{ data: Product | null; error: string | null; success: boolean }> {
        const { data: product, error } = await datasource.updateProductData(id, data);
        return {
            data: product,
            error: error?.message ?? null,
            success: !error
        };
    }

    async deleteProduct(id: string): Promise<{ error: string | null; success: boolean }> {
        const { error } = await datasource.deleteProductData(id);
        return {
            error: error?.message ?? null,
            success: !error
        };
    }

    async getLowStockProducts(threshold: number = 5): Promise<{ data: Array<{ id: string; name: string; stock: number }> | null; error: string | null }> {
        const { data, error } = await datasource.fetchLowStockProducts(threshold);
        return { data, error: error?.message ?? null };
    }
}

// Singleton instance
export const productRepository = new ProductRepositoryImpl();
