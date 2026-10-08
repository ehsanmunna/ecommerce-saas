'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { checkSlug, registerTenant } from '../lib/api-client';

type SlugState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'unavailable'; reason: string };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

const SLUG_REASONS: Record<string, string> = {
  invalid: 'Use 3-63 lowercase letters, digits, and hyphens',
  reserved: 'This slug is reserved by the platform',
  taken: 'This slug is already taken',
};

export default function SignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [plan, setPlan] = useState('BASIC');
  const [slugState, setSlugState] = useState<SlugState>({ kind: 'idle' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSlugChange(value: string) {
    const next = slugify(value);
    setSlug(next);
    setErrors((prev) => ({ ...prev, slug: '' }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (next.length < 3) {
      setSlugState({ kind: 'idle' });
      return;
    }
    setSlugState({ kind: 'checking' });
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await checkSlug(next);
        setSlugState(
          result.available
            ? { kind: 'available' }
            : { kind: 'unavailable', reason: SLUG_REASONS[result.reason ?? 'invalid'] },
        );
      } catch {
        setSlugState({ kind: 'idle' });
      }
    }, 300);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (companyName.trim().length < 2) next.companyName = 'Company name is required';
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length < 3) {
      next.slug = 'Slug must be 3-63 lowercase letters, digits, and hyphens';
    } else if (slugState.kind === 'unavailable') {
      next.slug = SLUG_REASONS[slugState.reason];
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) next.ownerEmail = 'Enter a valid email address';
    if (ownerPassword.length < 8) next.ownerPassword = 'Password must be at least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await registerTenant({
        companyName: companyName.trim(),
        slug,
        ownerEmail: ownerEmail.trim(),
        ownerPassword,
        plan,
      });
      router.push(`/signup/check-email?tenantId=${result.id}&slug=${encodeURIComponent(slug)}&email=${encodeURIComponent(ownerEmail.trim())}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  }

  const slugFeedback =
    slugState.kind === 'available' ? (
      <p className="text-sm text-green-600">{slug} is available</p>
    ) : slugState.kind === 'unavailable' ? (
      <p className="text-sm text-red-600">{slugState.reason}</p>
    ) : slugState.kind === 'checking' ? (
      <p className="text-sm text-gray-400">Checking availability…</p>
    ) : null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Create your store</h1>
          <p className="text-sm text-gray-500 mt-1">
            Already have a store? <Link href="/login" className="text-gray-900 underline">Sign in</Link>
          </p>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Company name
          <input
            className="border border-gray-300 rounded px-3 py-2"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Acme Inc"
            required
          />
          {errors.companyName && <span className="text-red-600">{errors.companyName}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Store slug
          <input
            className="border border-gray-300 rounded px-3 py-2"
            value={slug}
            onChange={(event) => handleSlugChange(event.target.value)}
            placeholder="acme"
            required
          />
          {slugFeedback}
          {errors.slug && <span className="text-red-600">{errors.slug}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Owner email
          <input
            type="email"
            className="border border-gray-300 rounded px-3 py-2"
            value={ownerEmail}
            onChange={(event) => setOwnerEmail(event.target.value)}
            placeholder="owner@acme.com"
            required
          />
          {errors.ownerEmail && <span className="text-red-600">{errors.ownerEmail}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            className="border border-gray-300 rounded px-3 py-2"
            value={ownerPassword}
            onChange={(event) => setOwnerPassword(event.target.value)}
            placeholder="At least 8 characters"
            required
          />
          {errors.ownerPassword && <span className="text-red-600">{errors.ownerPassword}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Plan
          <select
            className="border border-gray-300 rounded px-3 py-2"
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
          >
            <option value="BASIC">Basic</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </label>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-gray-900 text-white rounded px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create store'}
        </button>
      </form>
    </main>
  );
}
