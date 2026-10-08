'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { listCategories } from '../../lib/api-client';
import { PageShell } from '../../components/PageShell';
import { Breadcrumb } from '../../components/Breadcrumb';
import { ProductBrowser } from '../../components/ProductBrowser';

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    listCategories().then((cats) => {
      setName(cats.find((c) => c.slug === params.slug)?.name ?? params.slug);
    });
  }, [params.slug]);

  return (
    <PageShell>
      <Breadcrumb current={name ?? '…'} />
      <div className="flex flex-col items-center px-6 pb-6">
        <h1 className="font-heading text-4xl font-bold text-[#2f2f2f]">{name ?? '…'}</h1>
      </div>
      <Suspense fallback={null}>
        <ProductBrowser fixedCategorySlug={params.slug} />
      </Suspense>
    </PageShell>
  );
}
