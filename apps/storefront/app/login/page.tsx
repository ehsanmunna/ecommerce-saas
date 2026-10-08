'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginCustomer } from '../lib/api-client';
import { useSession } from '../lib/session-context';
import { PageShell } from '../components/PageShell';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const session = await loginCustomer(email, password);
      login(session);
      router.push(searchParams.get('redirect') ?? '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex justify-center px-6 py-20">
      <form onSubmit={handleSubmit} className="w-full max-w-[440px] flex flex-col gap-5">
        <h1 className="font-heading text-3xl font-bold text-[#2f2f2f]">Welcome Back</h1>

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
          className="h-12 rounded-[10px] border-2 border-border px-4 text-sm outline-none focus:border-primary"
        />

        <div className="text-right -mt-2">
          <Link href="/forgot-password" className="text-sm font-medium text-text-muted hover:text-link-hover">
            Forgot password?
          </Link>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="h-[51px] rounded-[20px] bg-primary hover:bg-primary-hover font-bold text-[#363636] disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="text-center text-sm text-text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-[#252b42] hover:text-link-hover">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <PageShell>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </PageShell>
  );
}
