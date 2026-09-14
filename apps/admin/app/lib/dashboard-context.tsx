'use client';

import { createContext, useContext } from 'react';
import type { MeResponse } from './api-client';

export const DashboardContext = createContext<MeResponse | null>(null);

export function useDashboardContext(): MeResponse {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboardContext must be used within the dashboard layout');
  }
  return ctx;
}
