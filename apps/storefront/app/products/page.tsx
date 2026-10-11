import { Suspense } from 'react';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProductBrowser } from '../components/ProductBrowser';

export default function ProductsPage() {
  return (
    <PageShell>
      <Breadcrumb current="All Products" />
      <div className="flex flex-col items-center px-6 pb-6">
        <h1 className="font-heading text-4xl font-bold text-[#2f2f2f]">All Products</h1>
      </div>
      <Suspense fallback={null}>
        <ProductBrowser />
      </Suspense>
    </PageShell>
  );
}
