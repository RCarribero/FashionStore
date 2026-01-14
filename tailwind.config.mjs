/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                // Primary - Pure black and white
                primary: {
                    DEFAULT: '#000000',
                    50: '#f8f8f8',
                    100: '#f0f0f0',
                    200: '#e0e0e0',
                    300: '#c0c0c0',
                    400: '#909090',
                    500: '#606060',
                    600: '#404040',
                    700: '#303030',
                    800: '#202020',
                    900: '#101010',
                    950: '#000000',
                },
                // Accent - Electric red for CTAs and highlights
                accent: {
                    DEFAULT: '#FF0000',
                    50: '#fff0f0',
                    100: '#ffe0e0',
                    200: '#ffc0c0',
                    300: '#ff9090',
                    400: '#ff5050',
                    500: '#FF0000',
                    600: '#e00000',
                    700: '#b80000',
                    800: '#900000',
                    900: '#700000',
                    950: '#400000',
                },
                // Success - Neon green for stock/available
                success: {
                    DEFAULT: '#00FF87',
                    50: '#f0fff7',
                    100: '#d0ffec',
                    200: '#a0ffd9',
                    300: '#60ffc0',
                    400: '#20ffa0',
                    500: '#00FF87',
                    600: '#00d970',
                    700: '#00b05a',
                    800: '#008845',
                    900: '#006030',
                    950: '#003820',
                },
                // Slate grays for neutral tones
                slate: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
            },
            fontFamily: {
                // Modern sans-serif for everything
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
            },
            fontSize: {
                // Bold display sizes
                'display-2xl': ['5rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '800' }],
                'display-xl': ['4rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '800' }],
                'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '700' }],
                'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
                'display-sm': ['1.875rem', { lineHeight: '1.25', fontWeight: '600' }],
                'display-xs': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },
            animation: {
                // Slide animations
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.5s ease-out',
                'slide-in-right': 'slideInRight 0.4s ease-out',
                'slide-out-right': 'slideOutRight 0.4s ease-in',
                // Fade animations
                'fade-in': 'fadeIn 0.3s ease-out',
                'fade-out': 'fadeOut 0.3s ease-in',
                'fade-in-up': 'fadeInUp 0.5s ease-out',
                // Scale animations
                'scale-in': 'scaleIn 0.3s ease-out',
                'zoom-in': 'zoomIn 0.4s ease-out',
                'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                // Continuous animations
                'marquee': 'marquee 30s linear infinite',
                'marquee-fast': 'marquee 15s linear infinite',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                // Hover animations
                'hover-lift': 'hoverLift 0.3s ease-out forwards',
            },
            keyframes: {
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                slideOutRight: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeOut: {
                    '0%': { opacity: '1' },
                    '100%': { opacity: '0' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                zoomIn: {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                bounceIn: {
                    '0%': { transform: 'scale(0.3)', opacity: '0' },
                    '50%': { transform: 'scale(1.05)' },
                    '70%': { transform: 'scale(0.9)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.4)' },
                    '50%': { boxShadow: '0 0 20px 10px rgba(255, 0, 0, 0.2)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                hoverLift: {
                    '0%': { transform: 'translateY(0)' },
                    '100%': { transform: 'translateY(-8px)' },
                },
            },
            boxShadow: {
                'glow': '0 0 20px rgba(255, 0, 0, 0.3)',
                'glow-lg': '0 0 40px rgba(255, 0, 0, 0.4)',
                'dark': '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
                'dark-lg': '0 20px 60px -15px rgba(0, 0, 0, 0.7)',
                'inner-dark': 'inset 0 2px 10px rgba(0, 0, 0, 0.3)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            },
            transitionDuration: {
                '400': '400ms',
                '600': '600ms',
            },
            scale: {
                '102': '1.02',
                '103': '1.03',
            },
            zIndex: {
                '60': '60',
                '70': '70',
                '80': '80',
                '90': '90',
                '100': '100',
            },
        },
    },
    plugins: [],
};
