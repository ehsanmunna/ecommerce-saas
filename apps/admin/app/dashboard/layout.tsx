'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { clearSession, fetchMe, getSession, MeResponse } from '../lib/api-client';
import { DashboardContext } from '../lib/dashboard-context';

const NAV_ITEMS = [
  { href: '/dashboard/products', label: 'Products' },
  { href: '/dashboard/orders', label: 'Orders' },
  { href: '/dashboard/customers', label: 'Customers' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/login');
      return;
    }
    fetchMe(session.tenantSlug, session.accessToken)
      .then(setMe)
      .catch(() => {
        clearSession();
        router.replace('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    clearSession();
    router.replace('/login');
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading…</div>;
  }

  if (!me) {
    // Redirect to /login is already in flight; render nothing meanwhile.
    return null;
  }

  return (
    <DashboardContext.Provider value={me}>
      <div className="min-h-screen flex">
        <aside className="w-60 border-r border-gray-200 p-4 flex flex-col gap-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Store</p>
            <p className="font-semibold">{me.tenant.name}</p>
            <p className="text-xs text-gray-500">{me.tenant.slug}</p>
          </div>

          <nav className="flex flex-col gap-1 text-sm">
            <Link href="/dashboard" className="rounded px-2 py-1 hover:bg-gray-100">
              Overview
            </Link>
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="rounded px-2 py-1 hover:bg-gray-100">
                {item.label}
              </Link>
            ))}
          </nav>

          <button onClick={handleLogout} className="mt-auto text-left text-sm text-gray-500 hover:text-gray-800">
            Sign out
          </button>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </DashboardContext.Provider>
  );
}
