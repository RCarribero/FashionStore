/**
 * Product Model
 * TypeScript interfaces for product data structures
 */

export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number; // In cents
    stock: number;
    images: string[];
    category_id: string | null;
    featured: boolean;
    created_at: string;
    updated_at: string;
    category?: {
        id: string;
        name: string;
        slug: string;
    };
}

export interface ProductFormData {
    name: string;
    description: string;
    price: number; // In euros (will be converted to cents)
    stock: number;
    category_id: string | null;
    images: string[];
    featured: boolean;
}

export interface ProductWithDiscount extends Product {
    discountedPrice: number | null;
    promotionTitle: string | null;
}

export interface ProductFilters {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    featured?: boolean;
    search?: string;
}
