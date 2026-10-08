'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  fetchPlatformTenants,
  getPlatformSession,
  PlatformTenant,
} from '../lib/platform-api-client';

const STATUSES = ['', 'PENDING_VERIFICATION', 'PROVISIONING', 'ACTIVE', 'PROVISIONING_FAILED', 'SUSPENDED'];

export default function PlatformTenantsPage() {
  const [status, setStatus] = useState('');
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getPlatformSession();
    if (!session) return;
    fetchPlatformTenants({ status: status || undefined }, session.accessToken)
      .then((result) => {
        setTenants(result.items);
        setTotal(result.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load tenants'));
  }, [status]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tenants ({total})</h1>
        <Link href="/platform/new" className="bg-gray-900 text-white rounded px-3 py-2 text-sm">
          New tenant
        </Link>
      </div>

      <select
        className="w-64 border border-gray-300 rounded px-3 py-2 text-sm"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
      >
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {value === '' ? 'All statuses' : value}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b border-gray-200">
            <th className="py-2">Name</th>
            <th>Slug</th>
            <th>Status</th>
            <th>Plan</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.id} className="border-b border-gray-100">
              <td className="py-2">
                <Link href={`/platform/${tenant.id}`} className="text-blue-700 underline">
                  {tenant.name}
                </Link>
              </td>
              <td>{tenant.slug}</td>
              <td>{tenant.status}</td>
              <td>{tenant.plan}</td>
              <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
