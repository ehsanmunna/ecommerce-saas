'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPlatformTenant, getPlatformSession } from '../../lib/platform-api-client';

export default function NewPlatformTenantPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [plan, setPlan] = useState('BASIC');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const session = getPlatformSession();
    if (!session) return;
    setError(null);
    setSubmitting(true);
    try {
      const tenant = await createPlatformTenant(
        { companyName, slug, ownerEmail, ownerPassword, plan },
        session.accessToken,
      );
      router.push(`/platform/${tenant.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-lg">
      <h1 className="text-xl font-semibold mb-4">Create tenant</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Company name
          <input className="border border-gray-300 rounded px-3 py-2" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Slug
          <input className="border border-gray-300 rounded px-3 py-2" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Owner email
          <input type="email" className="border border-gray-300 rounded px-3 py-2" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Owner password
          <input type="password" className="border border-gray-300 rounded px-3 py-2" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Plan
          <select className="border border-gray-300 rounded px-3 py-2" value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="BASIC">Basic</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="bg-gray-900 text-white rounded px-3 py-2 text-sm font-medium disabled:opacity-50">
          {submitting ? 'Creating…' : 'Create tenant'}
        </button>
      </form>
    </main>
  );
}
