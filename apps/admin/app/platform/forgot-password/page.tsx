'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { forgotPasswordPlatform } from '../../lib/platform-api-client';

export default function PlatformForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPasswordPlatform(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm flex flex-col gap-4">
        {submitted ? (
          <>
            <h1 className="text-xl font-semibold">Check Your Email</h1>
            <p className="text-sm text-gray-500">
              If an account exists for {email}, we&apos;ve sent a password reset link. It expires in 15
              minutes.
            </p>
            <button
              onClick={() => router.push('/platform/login')}
              className="bg-gray-900 text-white rounded px-3 py-2 text-sm font-medium"
            >
              Back to Sign In
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h1 className="text-xl font-semibold">Forgot Password</h1>
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input
                type="email"
                className="border border-gray-300 rounded px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="bg-gray-900 text-white rounded px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
