'use client';

import { FormEvent, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';

/**
 * Placeholder contact details, not a real tenant's - there is no settings
 * API to read a tenant's actual contact info from yet (see design.md
 * Non-Goals). The form submission is stubbed for the same reason: no
 * backend exists to receive it.
 */
export default function ContactPage() {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <PageShell>
      <Breadcrumb current="Contact Us" />
      <div className="flex justify-center px-6 pb-24">
        <div className="w-full max-w-[900px] grid gap-16" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
          <div className="flex flex-col gap-6">
            <h1 className="font-heading text-4xl font-bold text-[#2f2f2f]">Contact Us</h1>
            <div>
              <div className="text-base font-bold text-[#2f2f2f] mb-1">Customer Support</div>
              <p className="text-sm text-text-muted">support@example.com</p>
            </div>
            <div>
              <div className="text-base font-bold text-[#2f2f2f] mb-1">Phone</div>
              <p className="text-sm text-text-muted">+1 (555) 010-0100</p>
            </div>
            <div>
              <div className="text-base font-bold text-[#2f2f2f] mb-1">Headquarters</div>
              <p className="text-sm text-text-muted">123 Market Street, Suite 400</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {sent ? (
              <p className="text-sm font-bold text-success">
                Thanks — this form isn&apos;t wired up to a real inbox yet, so please use the email above in the
                meantime.
              </p>
            ) : (
              <>
                <input
                  placeholder="Your name"
                  required
                  className="h-12 rounded-[10px] border-2 border-border px-4 text-sm"
                />
                <input
                  type="email"
                  placeholder="Your email"
                  required
                  className="h-12 rounded-[10px] border-2 border-border px-4 text-sm"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Message"
                  required
                  rows={5}
                  className="rounded-[10px] border-2 border-border px-4 py-3 text-sm resize-none"
                />
                <button
                  type="submit"
                  className="h-[51px] rounded-[20px] bg-primary hover:bg-primary-hover font-bold text-[#363636]"
                >
                  Send Message
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </PageShell>
  );
}
