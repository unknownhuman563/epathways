import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import '../css/app.css';

import AdminLayout from './components/layout/AdminLayout';
import SalesLayout from './components/layout/SalesLayout';
import FlashToaster from './components/ui/FlashToaster';

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./pages/**/*.jsx', { eager: true })
    let page = pages[`./pages/${name}.jsx`]

    if (name.startsWith('admin/')) {
      page.default.layout = page.default.layout || ((page) => <AdminLayout>{page}</AdminLayout>);
    } else if (name.startsWith('portal/sales/')) {
      page.default.layout = page.default.layout || ((page) => <SalesLayout>{page}</SalesLayout>);
    }

    return page;

  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <>
        <App {...props} />
        <FlashToaster />
        <Toaster position="top-right" richColors closeButton />
      </>
    )
  },
})