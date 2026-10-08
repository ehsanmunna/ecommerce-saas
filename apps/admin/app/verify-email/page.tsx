'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getTenantStatus, resendVerificationBySlug, verifyEmail } from '../lib/api-client';

type Phase =
  | { kind: 'verifying' }
  | { kind: 'provisioning' }
  | { kind: 'active'; slug: string }
  | { kind: 'failed' }
  | { kind: 'invalid' };

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [phase, setPhase] = useState<Phase>({ kind: 'verifying' });
  const [slugInput, setSlugInput] = useState('');
  const [resendError, setResendError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    if (!token) {
      setPhase({ kind: 'invalid' });
      return;
    }

    let cancelled = false;

    async function pollStatus(tenantId: string) {
      while (!cancelled && Date.now() - startedAtRef.current < POLL_TIMEOUT_MS) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (cancelled) return;
        const status = await getTenantStatus(tenantId);
        if (status.status === 'ACTIVE') {
          setPhase({ kind: 'active', slug: status.slug });
          return;
        }
        if (status.status === 'PROVISIONING_FAILED') {
          setPhase({ kind: 'failed' });
          return;
        }
      }
      if (!cancelled) setPhase({ kind: 'failed' });
    }

    (async () => {
      try {
        const result = await verifyEmail(token);
        if (cancelled) return;
        if (result.status === 'ACTIVE') {
          setPhase({ kind: 'active', slug: result.slug });
        } else {
          setPhase({ kind: 'provisioning' });
          await pollStatus(result.id);
        }
      } catch {
        if (!cancelled) setPhase({ kind: 'invalid' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend(event: React.FormEvent) {
    event.preventDefault();
    if (!slugInput.trim() || resending) return;
    setResendError(null);
    setResending(true);
    try {
      await resendVerificationBySlug(slugInput.trim().toLowerCase());
      window.location.href = `/signup/check-email?email=&slug=${encodeURIComponent(slugInput.trim().toLowerCase())}`;
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setResending(false);
    }
  }

  if (phase.kind === 'verifying' || phase.kind === 'provisioning') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm flex flex-col gap-4 text-center">
          <h1 className="text-xl font-semibold">Setting up your store…</h1>
          <p className="text-sm text-gray-600">
            {phase.kind === 'verifying' ? 'Verifying your email.' : 'Creating your database and seeding defaults.'}{' '}
            This can take up to a minute.
          </p>
        </div>
      </main>
    );
  }

  if (phase.kind === 'active') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm flex flex-col gap-4 text-center">
          <h1 className="text-xl font-semibold">You&apos;re verified</h1>
          <p className="text-sm text-gray-600">Your store is ready. Sign in to start managing it.</p>
          <Link
            href={`/login?slug=${encodeURIComponent(phase.slug)}`}
            className="bg-gray-900 text-white rounded px-3 py-2 text-sm font-medium"
          >
            Continue to login
          </Link>
        </div>
      </main>
    );
  }

  if (phase.kind === 'failed') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm flex flex-col gap-4 text-center">
          <h1 className="text-xl font-semibold">Setup failed</h1>
          <p className="text-sm text-gray-600">
            Something went wrong while creating your store. Please try again or contact support.
          </p>
          <Link href="/signup" className="bg-gray-900 text-white rounded px-3 py-2 text-sm font-medium">
            Back to signup
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Link expired or invalid</h1>
        <p className="text-sm text-gray-600">
          Enter your store slug and we&apos;ll send a new verification link.
        </p>
        <form onSubmit={handleResend} className="flex flex-col gap-3">
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={slugInput}
            onChange={(event) => setSlugInput(event.target.value)}
            placeholder="Store slug"
            required
          />
          {resendError && <p className="text-sm text-red-600">{resendError}</p>}
          <button
            type="submit"
            disabled={resending}
            className="bg-gray-900 text-white rounded px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {resending ? 'Sending…' : 'Resend verification email'}
          </button>
        </form>
        <Link href="/signup" className="text-sm text-gray-500 underline text-center">
          Back to signup
        </Link>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
