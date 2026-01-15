/**
 * Theme Configuration
 * Design tokens and theme settings
 * 
 * Note: Primary theme configuration is in tailwind.config.mjs
 * This file exports commonly used design tokens for JS/TS usage
 */

export const COLORS = {
    primary: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
    },
    neutral: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717',
    },
} as const;

export const SPACING = {
    container: {
        padding: '1rem',
        maxWidth: '1280px',
    },
    section: {
        paddingY: '4rem',
    },
} as const;

export const BREAKPOINTS = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
} as const;

export const TRANSITIONS = {
    fast: '150ms ease-in-out',
    default: '300ms ease-in-out',
    slow: '500ms ease-in-out',
} as const;
