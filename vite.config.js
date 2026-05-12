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
            // app.jsx = Inertia/React admin app; app.css = standalone Tailwind bundle
            // for the plain-Blade user dashboards under resources/views/users/<dept>/.
            input: ['resources/js/app.jsx', 'resources/css/app.css'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    // REMOVE OR COMMENT OUT THE SERVER BLOCK BELOW



    resolve: {
        alias: {
            "@": "/resources/js",
            "@assets": "/resources/assets"
        }
    }
});
