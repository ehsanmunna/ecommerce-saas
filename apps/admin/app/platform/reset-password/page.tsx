'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPasswordPlatform } from '../../lib/platform-api-client';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await resetPasswordPlatform(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return <p className="text-sm text-red-600">Invalid or missing reset token.</p>;
  }

  if (done) {
    return (
      <>
        <h1 className="text-xl font-semibold">Password Reset</h1>
        <p className="text-sm text-gray-500">Your password has been updated.</p>
        <button
          onClick={() => router.push('/platform/login')}
          className="bg-gray-900 text-white rounded px-3 py-2 text-sm font-medium"
        >
          Go to Sign In
        </button>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Reset Password</h1>
      <label className="flex flex-col gap-1 text-sm">
        New password
        <input
          type="password"
          className="border border-gray-300 rounded px-3 py-2"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Confirm new password
        <input
          type="password"
          className="border border-gray-300 rounded px-3 py-2"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="bg-gray-900 text-white rounded px-3 py-2 text-sm font-medium disabled:opacity-50"
      >
        {submitting ? 'Resetting…' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function PlatformResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm">
          <ResetPasswordForm />
        </div>
      </Suspense>
    </main>
  );
}
