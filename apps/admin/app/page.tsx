'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession } from './lib/api-client';

const PUBLIC_PATHS = ['/signup', '/verify-email'];

export default function RootPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) return;
    router.replace(getSession() ? '/dashboard' : '/login');
  }, [router, pathname]);

  return null;
}
