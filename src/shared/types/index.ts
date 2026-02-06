/**
 * Shared Type Definitions
 * Types used across multiple modules
 */

export interface Category {
    id: string;
    name: string;
    slug: string;
    created_at?: string;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number; // In cents
    stock: number;
    category_id: string | null;
    category?: Category;
    images: string[];
    featured: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CartItem {
    productId: string;
    productName: string;
    productImage: string;
    price: number;
    size: string;
    quantity: number;
    availableStock: number; // Max available stock for this size
    expiresAt?: number; // Reservation expiry timestamp (ms since epoch)
}

export interface Cart {
    items: CartItem[];
    updatedAt: number;
}

export interface User {
    id: string;
    email: string;
    created_at?: string;
}

export interface Session {
    user: User;
    accessToken: string;
    refreshToken: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    success: boolean;
}

// Form Data Types
export interface ProductFormData {
    name: string;
    description: string;
    price: number;
    stock: number;
    category_id: string | null;
    images: string[];
    featured: boolean;
}

// Dashboard Stats
export interface DashboardStats {
    productCount: number;
    categoryCount: number;
    totalStock: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    featuredCount: number;
}
