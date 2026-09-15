'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerCustomer } from '../lib/api-client';
import { PageShell } from '../components/PageShell';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Privacy Policy to continue');
      return;
    }

    setSubmitting(true);
    try {
      await registerCustomer(email, password, firstName || undefined, lastName || undefined);
      // Registration does not issue a session (see design.md) - sign in next.
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="flex justify-center px-6 py-20">
        <form onSubmit={handleSubmit} className="w-full max-w-[440px] flex flex-col gap-5">
          <h1 className="font-heading text-3xl font-bold text-[#2f2f2f]">Create Account</h1>

          <div className="flex gap-4">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="h-12 flex-1 min-w-0 rounded-[10px] border-2 border-border px-4 text-sm outline-none focus:border-primary"
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="h-12 flex-1 min-w-0 rounded-[10px] border-2 border-border px-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="h-12 rounded-[10px] border-2 border-border px-4 text-sm outline-none focus:border-primary"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={8}
            className="h-12 rounded-[10px] border-2 border-border px-4 text-sm outline-none focus:border-primary"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            required
            className="h-12 rounded-[10px] border-2 border-border px-4 text-sm outline-none focus:border-primary"
          />

          <label className="flex items-start gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree to the{' '}
              <Link href="/privacy-policy" className="font-bold text-[#252b42] hover:text-link-hover">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/terms" className="font-bold text-[#252b42] hover:text-link-hover">
                Terms &amp; Conditions
              </Link>
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="h-[51px] rounded-[20px] bg-primary hover:bg-primary-hover font-bold text-[#363636] disabled:opacity-50"
          >
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#252b42] hover:text-link-hover">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </PageShell>
  );
}
