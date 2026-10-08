'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Category, createCategory, getSession, listCategories } from '../../lib/api-client';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', slug: '' });

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

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    try {
      const session = getSession();
      if (!session) throw new Error('Not signed in');
      await createCategory(session.tenantSlug, session.accessToken, form);
      setForm({ name: '', slug: '' });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create category failed');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Categories</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Name</th>
            <th>Slug</th>
            <th>Products</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="py-2">{c.name}</td>
              <td>{c.slug}</td>
              <td>{c._count?.products ?? 0}</td>
            </tr>
          ))}
          {!loading && categories.length === 0 && (
            <tr><td colSpan={3} className="py-4 text-gray-500">No categories yet.</td></tr>
          )}
        </tbody>
      </table>

      <form onSubmit={handleCreate} className="border rounded p-4 space-y-3 max-w-lg">
        <h2 className="font-semibold">New category</h2>
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <input required placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <button type="submit" className="rounded bg-gray-900 text-white px-3 py-1.5 text-sm">Create category</button>
      </form>
    </div>
  );
}
