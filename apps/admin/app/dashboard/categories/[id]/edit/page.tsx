'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Category, getSession, listCategories, updateCategory } from '../../../../lib/api-client';

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [category, setCategory] = useState<Category | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '' });

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    listCategories(session.tenantSlug, session.accessToken)
      .then((res) => {
        const found = res.find((c) => c.id === id);
        if (found) {
          setCategory(found);
          setForm({ name: found.name, slug: found.slug });
        } else {
          setNotFound(true);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load category'));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const session = getSession();
      if (!session) throw new Error('Not signed in');
      await updateCategory(session.tenantSlug, session.accessToken, id, form);
      router.push('/dashboard/categories');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  if (notFound) {
    return <p className="text-sm text-gray-500">Category not found. <Link href="/dashboard/categories" className="text-blue-600">Back to categories</Link></p>;
  }

  if (!category) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-semibold">Edit category</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="border rounded p-4 space-y-3">
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <input required placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <div className="flex gap-2">
          <button type="submit" className="rounded bg-gray-900 text-white px-3 py-1.5 text-sm">Save</button>
          <Link href="/dashboard/categories" className="text-sm text-gray-500 py-1.5">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
