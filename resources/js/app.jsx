import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import '../css/app.css';

import AdminLayout from './components/layout/AdminLayout';
import SalesLayout from './components/layout/SalesLayout';
import EducationLayout from './components/layout/EducationLayout';
import EnglishLayout from './components/layout/EnglishLayout';
import ImmigrationLayout from './components/layout/ImmigrationLayout';
import AccommodationLayout from './components/layout/AccommodationLayout';
import FlashToaster from './components/ui/FlashToaster';

// Map portal-path prefix → layout component. Pages under
// resources/js/pages/portal/<role>/ are automatically wrapped.
const PORTAL_LAYOUTS = {
  'portal/sales/': SalesLayout,
  'portal/education/': EducationLayout,
  'portal/english/': EnglishLayout,
  'portal/immigration/': ImmigrationLayout,
  'portal/accommodation/': AccommodationLayout,
};

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./pages/**/*.jsx', { eager: true })
    let page = pages[`./pages/${name}.jsx`]

    if (name.startsWith('admin/')) {
      page.default.layout = page.default.layout || ((page) => <AdminLayout>{page}</AdminLayout>);
    } else {
      const match = Object.keys(PORTAL_LAYOUTS).find((prefix) => name.startsWith(prefix));
      if (match) {
        const Layout = PORTAL_LAYOUTS[match];
        page.default.layout = page.default.layout || ((page) => <Layout>{page}</Layout>);
      }
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