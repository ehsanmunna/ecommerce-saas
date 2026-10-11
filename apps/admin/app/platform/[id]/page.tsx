'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  fetchPlatformTenant,
  getPlatformSession,
  PlatformTenant,
  resendVerificationForTenant,
  retryProvisioning,
  revokeVerificationToken,
  updateTenantPlan,
  updateTenantStatus,
} from '../../lib/platform-api-client';

export default function PlatformTenantDetailPage() {
  const params = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<PlatformTenant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reload() {
    const session = getPlatformSession();
    if (!session) return;
    fetchPlatformTenant(params.id, session.accessToken)
      .then(setTenant)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }

  useEffect(reload, [params.id]);

  async function run(action: (token: string) => Promise<unknown>) {
    const session = getPlatformSession();
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await action(session.accessToken);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  if (!tenant) {
    return <div className="text-gray-500">{error ?? 'Loading…'}</div>;
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h1 className="text-xl font-semibold">{tenant.name}</h1>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-gray-500">Slug</dt><dd>{tenant.slug}</dd>
        <dt className="text-gray-500">Status</dt><dd>{tenant.status}</dd>
        <dt className="text-gray-500">Plan</dt><dd>{tenant.plan}</dd>
        <dt className="text-gray-500">Database</dt><dd>{tenant.databaseName}</dd>
        <dt className="text-gray-500">Owner email</dt><dd>{tenant.ownerEmail ?? '—'}</dd>
        <dt className="text-gray-500">Email verified</dt><dd>{tenant.emailVerifiedAt ? new Date(tenant.emailVerifiedAt).toLocaleString() : '—'}</dd>
        <dt className="text-gray-500">Created</dt><dd>{new Date(tenant.createdAt).toLocaleString()}</dd>
      </dl>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {tenant.status !== 'SUSPENDED' && (
          <button disabled={busy} onClick={() => run((t) => updateTenantStatus(tenant.id, 'SUSPENDED', t))} className="border border-gray-300 rounded px-3 py-2 text-sm">
            Suspend
          </button>
        )}
        {tenant.status === 'SUSPENDED' && (
          <button disabled={busy} onClick={() => run((t) => updateTenantStatus(tenant.id, 'ACTIVE', t))} className="border border-gray-300 rounded px-3 py-2 text-sm">
            Reactivate
          </button>
        )}
        {tenant.status === 'PENDING_VERIFICATION' && (
          <>
            <button disabled={busy} onClick={() => run((t) => resendVerificationForTenant(tenant.id, t))} className="border border-gray-300 rounded px-3 py-2 text-sm">
              Resend verification
            </button>
            <button disabled={busy} onClick={() => run((t) => revokeVerificationToken(tenant.id, t))} className="border border-gray-300 rounded px-3 py-2 text-sm">
              Revoke token
            </button>
          </>
        )}
        {tenant.status === 'PROVISIONING_FAILED' && (
          <button disabled={busy} onClick={() => run((t) => retryProvisioning(tenant.id, t))} className="border border-gray-300 rounded px-3 py-2 text-sm">
            Retry provisioning
          </button>
        )}
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const plan = (event.currentTarget.elements.namedItem('plan') as HTMLSelectElement).value;
          run((t) => updateTenantPlan(tenant.id, plan, t));
        }}
      >
        <select name="plan" defaultValue={tenant.plan} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="BASIC">BASIC</option>
          <option value="PRO">PRO</option>
          <option value="ENTERPRISE">ENTERPRISE</option>
        </select>
        <button type="submit" disabled={busy} className="border border-gray-300 rounded px-3 py-2 text-sm">
          Update plan
        </button>
      </form>
    </div>
  );
}
