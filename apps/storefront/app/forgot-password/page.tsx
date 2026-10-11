'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { forgotPasswordCustomer } from '../lib/api-client';
import { PageShell } from '../components/PageShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPasswordCustomer(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="flex justify-center px-6 py-20">
        <div className="w-full max-w-[440px] flex flex-col gap-5">
          {submitted ? (
            <>
              <h1 className="font-heading text-3xl font-bold text-[#2f2f2f]">Check Your Email</h1>
              <p className="text-sm text-text-muted">
                If an account exists for {email}, we&apos;ve sent a password reset link. It expires in 15
                minutes.
              </p>
              <Link
                href="/login"
                className="h-[51px] rounded-[20px] bg-primary hover:bg-primary-hover font-bold text-[#363636] flex items-center justify-center"
              >
                Back to Sign In
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <h1 className="font-heading text-3xl font-bold text-[#2f2f2f]">Forgot Password</h1>
              <p className="text-sm text-text-muted">
                Enter the email associated with your account and we&apos;ll send you a reset link.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="h-12 rounded-[10px] border-2 border-border px-4 text-sm outline-none focus:border-primary"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="h-[51px] rounded-[20px] bg-primary hover:bg-primary-hover font-bold text-[#363636] disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Send Reset Link'}
              </button>
              <p className="text-center text-sm text-text-muted">
                Remembered your password?{' '}
                <Link href="/login" className="font-bold text-[#252b42] hover:text-link-hover">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  );
}
