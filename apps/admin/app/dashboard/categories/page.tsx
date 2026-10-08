'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Category, getSession, listCategories } from '../../lib/api-client';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const session = getSession();
      if (!session) throw new Error('Not signed in');
      setLoading(true);
      setError(null);
      setCategories(await listCategories(session.tenantSlug, session.accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categories</h1>
        <Link href="/dashboard/categories/new" className="rounded bg-gray-900 text-white px-3 py-1.5 text-sm">
          New category
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Name</th>
            <th>Slug</th>
            <th>Products</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="py-2">{c.name}</td>
              <td>{c.slug}</td>
              <td>{c._count?.products ?? 0}</td>
              <td className="text-right">
                <Link href={`/dashboard/categories/${c.id}/edit`} className="text-blue-600">Edit</Link>
              </td>
            </tr>
          ))}
          {!loading && categories.length === 0 && (
            <tr><td colSpan={4} className="py-4 text-gray-500">No categories yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
