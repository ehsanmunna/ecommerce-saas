'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  deleteTenant,
  fetchPlatformTenants,
  getPlatformSession,
  PlatformTenant,
  updateTenantStatus,
} from '../lib/platform-api-client';

const STATUSES = ['', 'PENDING_VERIFICATION', 'PROVISIONING', 'ACTIVE', 'PROVISIONING_FAILED', 'SUSPENDED', 'EXPIRED', 'DELETED'];

export default function PlatformTenantsPage() {
  const [status, setStatus] = useState('');
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const session = getPlatformSession();
    if (!session) return;
    fetchPlatformTenants({ status: status || undefined }, session.accessToken)
      .then((result) => {
        setTenants(result.items);
        setTotal(result.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load tenants'));
  }, [status, refreshKey]);

  const refresh = () => setRefreshKey((key) => key + 1);

  const handleStatusChange = (tenant: PlatformTenant, next: string) => {
    const session = getPlatformSession();
    if (!session) return;
    updateTenantStatus(tenant.id, next, session.accessToken)
      .then(refresh)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to update status'));
  };

  const handleDelete = (tenant: PlatformTenant) => {
    const session = getPlatformSession();
    if (!session) return;
    if (!window.confirm(`Delete tenant "${tenant.name}"? Its status will become DELETED.`)) return;
    deleteTenant(tenant.id, session.accessToken)
      .then(refresh)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to delete tenant'));
  };

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
            <th>Actions</th>
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
              <td className="flex items-center gap-2 py-1">
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                  value={tenant.status}
                  onChange={(event) => handleStatusChange(tenant, event.target.value)}
                >
                  {(['ACTIVE', 'SUSPENDED', 'EXPIRED'] as const).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                  {tenant.status !== 'ACTIVE' && tenant.status !== 'SUSPENDED' && tenant.status !== 'EXPIRED' && (
                    <option value={tenant.status}>{tenant.status}</option>
                  )}
                </select>
                <button
                  className="text-xs text-red-600 underline"
                  onClick={() => handleDelete(tenant)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
