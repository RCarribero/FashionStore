/**
 * String Extensions
 * Slug generation and string manipulation utilities
 */

/**
 * Generate URL-safe slug from text
 */
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '')    // Remove special chars
        .replace(/[\s_]+/g, '-')          // Replace spaces with hyphens
        .replace(/-+/g, '-')              // Remove consecutive hyphens
        .replace(/^-+|-+$/g, '');         // Trim hyphens from ends
}

/**
 * Generate unique ID for cart items
 */
export function getCartItemKey(productId: string, size: string): string {
    return `${productId}-${size}`;
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Generate random ID
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}
