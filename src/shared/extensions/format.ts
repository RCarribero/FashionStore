/**
 * Format Extensions
 * Price, date and text formatting utilities
 */

import { APP_CONFIG } from '@/config';

/**
 * Format price from cents to display string
 */
export function formatPrice(cents: number): string {
    const amount = cents / 100;
    return new Intl.NumberFormat(APP_CONFIG.locale, {
        style: 'currency',
        currency: APP_CONFIG.currency,
    }).format(amount);
}

/**
 * Format date to locale string
 */
export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(APP_CONFIG.locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d);
}

/**
 * Format relative time (e.g., "hace 2 dias")
 */
export function formatRelativeTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} dias`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return formatDate(d);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}
