'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { resetPasswordCustomer } from '../lib/api-client';
import { PageShell } from '../components/PageShell';

function ResetPasswordForm() {
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
      await resetPasswordCustomer(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-text-muted">Invalid or missing reset token.</p>
    );
  }

  if (done) {
    return (
      <>
        <h1 className="font-heading text-3xl font-bold text-[#2f2f2f]">Password Reset</h1>
        <p className="text-sm text-text-muted">Your password has been updated. You can now sign in.</p>
        <Link
          href="/login"
          className="h-[51px] rounded-[20px] bg-primary hover:bg-primary-hover font-bold text-[#363636] flex items-center justify-center"
        >
          Go to Sign In
        </Link>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h1 className="font-heading text-3xl font-bold text-[#2f2f2f]">Reset Password</h1>
      <p className="text-sm text-text-muted">Enter a new password for your account.</p>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="New password"
        required
        minLength={8}
        className="h-12 rounded-[10px] border-2 border-border px-4 text-sm outline-none focus:border-primary"
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
        required
        minLength={8}
        className="h-12 rounded-[10px] border-2 border-border px-4 text-sm outline-none focus:border-primary"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="h-[51px] rounded-[20px] bg-primary hover:bg-primary-hover font-bold text-[#363636] disabled:opacity-50"
      >
        {submitting ? 'Resetting…' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <PageShell>
      <div className="flex justify-center px-6 py-20">
        <div className="w-full max-w-[440px] flex flex-col gap-5">
          <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </PageShell>
  );
}
