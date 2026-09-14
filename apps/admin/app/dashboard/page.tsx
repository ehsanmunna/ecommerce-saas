'use client';

import { useDashboardContext } from '../lib/dashboard-context';

export default function DashboardHomePage() {
  const { tenant, user } = useDashboardContext();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Welcome{user ? `, ${user.email}` : ''}</h1>
      <p className="text-gray-600">
        You are managing <strong>{tenant.name}</strong> ({tenant.slug}).
      </p>
    </div>
  );
}
