/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                // Primary palette - Sophisticated navy and charcoal
                navy: {
                    50: '#f0f4f8',
                    100: '#d9e2ec',
                    200: '#bcccdc',
                    300: '#9fb3c8',
                    400: '#829ab1',
                    500: '#627d98',
                    600: '#486581',
                    700: '#334e68',
                    800: '#243b53',
                    900: '#102a43',
                    950: '#0a1929',
                },
                charcoal: {
                    50: '#f7f7f7',
                    100: '#e3e3e3',
                    200: '#c8c8c8',
                    300: '#a4a4a4',
                    400: '#818181',
                    500: '#666666',
                    600: '#515151',
                    700: '#434343',
                    800: '#383838',
                    900: '#313131',
                    950: '#1a1a1a',
                },
                // Accent colors
                leather: {
                    50: '#fdf8f6',
                    100: '#f8ebe4',
                    200: '#f2d5c4',
                    300: '#e8b89a',
                    400: '#dc9468',
                    500: '#d17a4a',
                    600: '#c3653f',
                    700: '#a25036',
                    800: '#844331',
                    900: '#6c3a2b',
                    950: '#3a1c14',
                },
                gold: {
                    50: '#fdfde9',
                    100: '#fafbc5',
                    200: '#f7f58f',
                    300: '#f0e94f',
                    400: '#e6d71f',
                    500: '#d6bf12',
                    600: '#b9960d',
                    700: '#946e0e',
                    800: '#7a5713',
                    900: '#684716',
                    950: '#3d2608',
                },
                // Neutral off-whites
                cream: {
                    50: '#fefdfb',
                    100: '#fdfbf7',
                    200: '#faf6ee',
                    300: '#f5efe1',
                    400: '#ede4ce',
                    500: '#e2d5b8',
                    600: '#c9b78e',
                    700: '#a89468',
                    800: '#8a7852',
                    900: '#716344',
                    950: '#3d3423',
                },
            },
            fontFamily: {
                // Elegant serif for headings
                display: ['Playfair Display', 'Georgia', 'serif'],
                // Clean sans-serif for body text
                body: ['Inter', 'system-ui', 'sans-serif'],
            },
            fontSize: {
                // Custom fluid typography scale
                'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
                'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
                'display-lg': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
                'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
                'display-sm': ['1.875rem', { lineHeight: '1.25' }],
                'display-xs': ['1.5rem', { lineHeight: '1.3' }],
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },
            animation: {
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'slide-out-right': 'slideOutRight 0.3s ease-in',
                'fade-in': 'fadeIn 0.2s ease-out',
                'fade-out': 'fadeOut 0.2s ease-in',
                'scale-in': 'scaleIn 0.2s ease-out',
            },
            keyframes: {
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
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
            boxShadow: {
                'elegant': '0 4px 20px -2px rgba(16, 42, 67, 0.08)',
                'elegant-lg': '0 10px 40px -10px rgba(16, 42, 67, 0.15)',
            },
        },
    },
    plugins: [],
};
