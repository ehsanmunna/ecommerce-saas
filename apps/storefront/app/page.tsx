'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { browseProducts, listCategories, type Category, type Product } from './lib/api-client';
import { PageShell } from './components/PageShell';
import { ProductCard } from './components/ProductCard';

const TILE_COLORS = ['#c6f68c', '#96caff', '#cfff96'];

const SERVICES = [
  { icon: '/assets/icon-service-1.svg', title: 'Free Shipping', body: 'On order over $99' },
  { icon: '/assets/icon-service-2.svg', title: 'Secure Payment', body: '100% secure payment' },
  { icon: '/assets/icon-return.svg', title: 'Easy Return', body: 'Money back guarantee' },
  { icon: '/assets/icon-help.svg', title: 'Help Center', body: "We're here to help" },
];

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listCategories(), browseProducts({ sort: 'newest', pageSize: 8 })])
      .then(([cats, result]) => {
        setCategories(cats);
        setProducts(result.items);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <div className="flex justify-center px-6 pb-24">
        <div className="relative w-full max-w-[1592px] aspect-[1592/745] rounded-2xl overflow-hidden">
          <Image src="/assets/banner.jpg" alt="" fill priority className="object-cover" />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex justify-center px-6 pb-24">
          <div className="w-full max-w-[1586px] grid gap-10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {categories.slice(0, 3).map((category, i) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="relative h-[280px] rounded-2xl overflow-hidden flex items-end p-8"
                style={{ background: TILE_COLORS[i % TILE_COLORS.length] }}
              >
                <div className="flex flex-col gap-3 items-start">
                  <div className="font-heading text-3xl font-bold text-[#2f2f2f]">{category.name}</div>
                  <span className="rounded-2xl bg-primary hover:bg-primary-hover px-6 py-3 font-bold text-[#363636]">
                    Shop Now
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center px-6 pb-16">
        <h2 className="font-heading text-4xl font-bold text-center text-[#2f2f2f] mb-12">New Collections</h2>
        {loading ? (
          <p className="text-text-muted">Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-text-muted">No products yet.</p>
        ) : (
          <div className="w-full max-w-[1650px] grid gap-10" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        <Link
          href="/products"
          className="mt-14 h-[51px] px-10 rounded-2xl border-2 border-ink hover:bg-primary hover:border-primary flex items-center justify-center font-bold text-ink"
        >
          View all products
        </Link>
      </div>

      <div className="flex justify-center px-6 pb-24">
        <div className="w-full max-w-[1650px] grid gap-10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {SERVICES.map((service) => (
            <div key={service.title} className="flex items-center gap-5">
              <Image src={service.icon} alt="" width={56} height={56} />
              <div>
                <div className="text-base font-bold text-[#373737] mb-2">{service.title}</div>
                <div className="text-base text-[#373737]">{service.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
