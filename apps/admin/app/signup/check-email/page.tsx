'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resendVerification } from '../../lib/api-client';

const RESEND_COOLDOWN_SECONDS = 60;

function CheckEmailForm() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId') ?? '';
  const email = searchParams.get('email') ?? '';

  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResend() {
    if (!tenantId || cooldown > 0 || resending) return;
    setError(null);
    setResending(true);
    try {
      await resendVerification(tenantId);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-gray-600">
          We sent a verification link to <span className="font-medium text-gray-900">{email}</span>. The link
          expires in 24 hours.
        </p>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="border border-gray-300 rounded px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : 'Resend email'}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="text-sm text-gray-500">
          Already verified? <Link href="/login" className="text-gray-900 underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailForm />
    </Suspense>
  );
}
