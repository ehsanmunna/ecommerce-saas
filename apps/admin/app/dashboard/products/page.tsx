'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Category,
  deactivateProduct,
  getSession,
  listCategories,
  listProducts,
  Product,
} from '../../lib/api-client';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = useCallback(() => {
    const session = getSession();
    if (!session) throw new Error('Not signed in');
    return session;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const session = getToken();
      setLoading(true);
      setError(null);
      const result = await listProducts(session.tenantSlug, session.accessToken, {
        search: search || undefined,
        categorySlug: categorySlug || undefined,
        status: (status as 'active' | 'draft' | 'archived') || undefined,
      });
      setProducts(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [getToken, search, categorySlug, status]);

  const refreshCategories = useCallback(async () => {
    try {
      const session = getToken();
      setCategories(await listCategories(session.tenantSlug, session.accessToken));
    } catch {
      // categories load failure surfaces on product refresh too
    }
  }, [getToken]);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    const t = setTimeout(refresh, 250);
    return () => clearTimeout(t);
  }, [refresh]);

  async function handleDeactivate(id: string) {
    try {
      const session = getToken();
      await deactivateProduct(session.tenantSlug, session.accessToken, id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deactivate failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <Link href="/dashboard/products/new" className="rounded bg-gray-900 text-white px-3 py-1.5 text-sm">
          New product
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name…"
          className="border rounded px-2 py-1 text-sm"
        />
        <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Name</th>
            <th>Price</th>
            <th>Category</th>
            <th>Status</th>
            <th>Variants</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.name}</td>
              <td>{p.regularPrice}</td>
              <td>{p.category?.name ?? '—'}</td>
              <td>{p.status}</td>
              <td>{p.variants?.length ?? 0}</td>
              <td className="text-right space-x-3">
                <Link href={`/dashboard/products/${p.id}/edit`} className="text-blue-600">Edit</Link>
                {p.status === 'active' && (
                  <button onClick={() => handleDeactivate(p.id)} className="text-red-600">Deactivate</button>
                )}
              </td>
            </tr>
          ))}
          {!loading && products.length === 0 && (
            <tr><td colSpan={6} className="py-4 text-gray-500">No products found.</td></tr>
          )}
        </tbody>
      </table>
      <p className="text-xs text-gray-500">{total} products</p>
    </div>
  );
}
