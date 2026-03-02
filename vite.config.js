import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    optimizeDeps: {
        include: ["swiper"],
    },
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    // REMOVE OR COMMENT OUT THE SERVER BLOCK BELOW



    resolve: {
        alias: {
            "@": "/resources/js",
            "@assets": "/resources/Assets",
            "@AdminLayout": "/resources/js/components/AdminLayout"
        }
    }
});
