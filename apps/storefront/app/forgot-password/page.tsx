'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { PageShell } from '../components/PageShell';

/**
 * Submission is stubbed, not wired to a real request - no email-sending
 * infrastructure exists in this system yet. See storefront-web spec,
 * "Forgot Password is present but its submission is stubbed".
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <PageShell>
      <div className="flex justify-center px-6 py-20">
        <div className="w-full max-w-[440px] flex flex-col gap-5">
          {submitted ? (
            <>
              <h1 className="font-heading text-3xl font-bold text-[#2f2f2f]">Check Your Email</h1>
              <p className="text-sm text-text-muted">
                Password reset isn&apos;t available yet — this system doesn&apos;t send email yet. Please contact
                support if you need help getting back into your account.
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
              <button
                type="submit"
                className="h-[51px] rounded-[20px] bg-primary hover:bg-primary-hover font-bold text-[#363636]"
              >
                Send Reset Link
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
