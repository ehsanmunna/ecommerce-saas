'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login, setSession } from '../lib/api-client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tenantSlug, setTenantSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const slug = searchParams.get('slug');
    if (slug) setTenantSlug(slug);
  }, [searchParams]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const slug = tenantSlug.trim().toLowerCase();
      const result = await login(slug, email, password);
      setSession({ tenantSlug: slug, accessToken: result.accessToken, refreshToken: result.refreshToken });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Sign in to your store</h1>

        <label className="flex flex-col gap-1 text-sm">
          Store slug
          <input
            className="border border-gray-300 rounded px-3 py-2"
            value={tenantSlug}
            onChange={(event) => setTenantSlug(event.target.value)}
            placeholder="acme"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            className="border border-gray-300 rounded px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            className="border border-gray-300 rounded px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-gray-900 text-white rounded px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
