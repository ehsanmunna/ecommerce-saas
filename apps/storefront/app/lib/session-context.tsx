'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, getSession, setSession, type CustomerSession } from './api-client';

interface SessionContextValue {
  session: CustomerSession | null;
  /** false until the first read of localStorage completes (avoids a flash of logged-out UI). */
  loading: boolean;
  login: (session: CustomerSession) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSessionState(getSession());
    setLoading(false);
  }, []);

  const login = useCallback((next: CustomerSession) => {
    setSession(next);
    setSessionState(next);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
  }, []);

  return <SessionContext.Provider value={{ session, loading, login, logout }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}

/**
 * Redirects to /login when there is no customer session, once the initial
 * session read has completed. Renders nothing while loading or redirecting
 * so protected pages never flash their content to a logged-out visitor -
 * see storefront-web spec, "Checkout and account pages require a
 * logged-in customer".
 */
export function useRequireAuth(): CustomerSession | null {
  const { session, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, session, router, pathname]);

  return loading ? null : session;
}
