'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Category, createProduct, getSession, listCategories } from '../../../lib/api-client';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    shortDescription: '',
    description: '',
    regularPrice: '',
    salePrice: '',
    stockQuantity: '',
    mainImage: '',
    status: 'active' as 'active' | 'draft' | 'archived',
  });

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
        sku: form.sku,
        categoryId: form.categoryId,
        shortDescription: form.shortDescription || undefined,
        description: form.description || undefined,
        regularPrice: Number(form.regularPrice),
        salePrice: form.salePrice ? Number(form.salePrice) : undefined,
        stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : undefined,
        mainImage: form.mainImage || undefined,
        status: form.status,
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
        <input required placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <input required type="number" min="0" step="0.01" placeholder="Regular price" value={form.regularPrice} onChange={(e) => setForm({ ...form, regularPrice: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <input type="number" min="0" step="0.01" placeholder="Sale price" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <input type="number" min="0" placeholder="Stock quantity" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <input placeholder="Short description" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <input placeholder="Main image URL" value={form.mainImage} onChange={(e) => setForm({ ...form, mainImage: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })} className="border rounded px-2 py-1 w-full text-sm">
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
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
