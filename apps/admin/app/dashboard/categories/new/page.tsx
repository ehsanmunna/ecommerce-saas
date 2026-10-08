'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createCategory, getSession } from '../../../lib/api-client';

export default function NewCategoryPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '' });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const session = getSession();
      if (!session) throw new Error('Not signed in');
      await createCategory(session.tenantSlug, session.accessToken, form);
      router.push('/dashboard/categories');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-semibold">New category</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="border rounded p-4 space-y-3">
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <input required placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" />
        <div className="flex gap-2">
          <button type="submit" className="rounded bg-gray-900 text-white px-3 py-1.5 text-sm">Create</button>
          <Link href="/dashboard/categories" className="text-sm text-gray-500 py-1.5">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
