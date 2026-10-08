'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import {
  Category,
  createVariant,
  getSession,
  listCategories,
  listProducts,
  Product,
  updateProduct,
} from '../../../../lib/api-client';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
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
  const [variantForm, setVariantForm] = useState({ sku: '', priceOverride: '', stock: '' });

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    listCategories(session.tenantSlug, session.accessToken).then(setCategories).catch(() => {});
    listProducts(session.tenantSlug, session.accessToken, { pageSize: 100 })
      .then((res) => {
        const found = res.items.find((p) => p.id === id);
        if (found) {
          setProduct(found);
          setForm({
            name: found.name,
            sku: found.sku,
            categoryId: found.categoryId,
            shortDescription: found.shortDescription ?? '',
            description: found.description ?? '',
            regularPrice: String(found.regularPrice),
            salePrice: found.salePrice != null ? String(found.salePrice) : '',
            stockQuantity: String(found.stockQuantity ?? 0),
            mainImage: found.mainImage ?? '',
            status: found.status,
          });
        } else {
          setNotFound(true);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load product'));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const session = getSession();
      if (!session) throw new Error('Not signed in');
      await updateProduct(session.tenantSlug, session.accessToken, id, {
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
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function handleAddVariant(e: FormEvent) {
    e.preventDefault();
    try {
      const session = getSession();
      if (!session) throw new Error('Not signed in');
      await createVariant(session.tenantSlug, session.accessToken, id, {
        sku: variantForm.sku,
        priceOverride: variantForm.priceOverride ? Number(variantForm.priceOverride) : undefined,
        stock: variantForm.stock ? Number(variantForm.stock) : undefined,
      });
      router.push('/dashboard/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add variant failed');
    }
  }

  if (notFound) {
    return <p className="text-sm text-gray-500">Product not found. <Link href="/dashboard/products" className="text-blue-600">Back to products</Link></p>;
  }

  if (!product) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-semibold">Edit product</h1>
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
          <button type="submit" className="rounded bg-gray-900 text-white px-3 py-1.5 text-sm">Save</button>
          <Link href="/dashboard/products" className="text-sm text-gray-500 py-1.5">Cancel</Link>
        </div>
      </form>

      <form onSubmit={handleAddVariant} className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Add variant</h2>
        <input required placeholder="SKU" value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <input type="number" min="0" step="0.01" placeholder="Price override" value={variantForm.priceOverride} onChange={(e) => setVariantForm({ ...variantForm, priceOverride: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <input type="number" min="0" placeholder="Stock" value={variantForm.stock} onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <button type="submit" className="rounded bg-gray-900 text-white px-3 py-1.5 text-sm">Add variant</button>
      </form>
    </div>
  );
}
