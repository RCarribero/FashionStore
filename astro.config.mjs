// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
    site: 'https://fashionstore.victoriafp.online',
    output: 'server',
    adapter: node({
        mode: 'standalone'
    }),
    integrations: [
        react(),
        tailwind()
    ],
    vite: {
        ssr: {
            noExternal: ['nanostores', '@nanostores/react', '@nanostores/persistent']
        }
    }
});
