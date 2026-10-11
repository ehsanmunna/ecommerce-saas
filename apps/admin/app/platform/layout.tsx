'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { clearPlatformSession, getPlatformSession } from '../lib/platform-api-client';

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(pathname === '/platform/login');

  useEffect(() => {
    if (pathname === '/platform/login') {
      setAuthorized(true);
      return;
    }
    if (!getPlatformSession()) {
      router.replace('/platform/login');
      return;
    }
    setAuthorized(true);
  }, [pathname, router]);

  if (pathname === '/platform/login') {
    return <>{children}</>;
  }

  if (!authorized) {
    return <div className="p-8 text-gray-500">Loading…</div>;
  }

  function handleLogout() {
    clearPlatformSession();
    router.replace('/platform/login');
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-gray-200 p-4 flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Platform</p>
          <p className="font-semibold">Admin</p>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/platform" className="rounded px-2 py-1 hover:bg-gray-100">
            Tenants
          </Link>
          <Link href="/platform/new" className="rounded px-2 py-1 hover:bg-gray-100">
            New tenant
          </Link>
        </nav>
        <button onClick={handleLogout} className="mt-auto text-left text-sm text-gray-500 hover:text-gray-800">
          Sign out
        </button>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
