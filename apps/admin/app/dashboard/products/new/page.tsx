'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Category, createProduct, getSession, listCategories } from '../../../lib/api-client';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', categoryId: '' });

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    listCategories(session.tenantSlug, session.accessToken).then(setCategories).catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const session = getSession();
      if (!session) throw new Error('Not signed in');
      await createProduct(session.tenantSlug, session.accessToken, {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        categoryId: form.categoryId,
      });
      router.push('/dashboard/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-semibold">New product</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="border rounded p-4 space-y-3">
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <input required type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="border rounded px-2 py-1 w-full text-sm">
          <option value="">Select category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="rounded bg-gray-900 text-white px-3 py-1.5 text-sm">Create</button>
          <Link href="/dashboard/products" className="text-sm text-gray-500 py-1.5">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
