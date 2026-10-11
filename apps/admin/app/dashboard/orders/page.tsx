'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  AdminOrder,
  getSession,
  listOrders,
} from '../../lib/api-client';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED'];

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'DELIVERED'
      ? 'bg-green-100 text-green-800'
      : status === 'CANCELLED'
        ? 'bg-red-100 text-red-800'
        : status === 'SHIPPED'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const session = getSession();
      if (!session) throw new Error('Not signed in');
      setLoading(true);
      setError(null);
      const result = await listOrders(session.tenantSlug, session.accessToken, {
        search: search || undefined,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        page,
        pageSize,
      });
      setOrders(result.items);
      setTotal(result.total);
      setTotalPages(Math.max(1, Math.ceil(result.total / pageSize)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [search, status, paymentStatus, page, pageSize]);

  useEffect(() => {
    const t = setTimeout(refresh, 250);
    return () => clearTimeout(t);
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Orders</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search recipient or email…"
          className="border rounded px-2 py-1 text-sm"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border rounded px-2 py-1 text-sm">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className="border rounded px-2 py-1 text-sm">
          <option value="">All payment</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Order</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Payment</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b">
              <td className="py-2">
                <Link href={`/dashboard/orders/${o.id}`} className="text-blue-600 hover:underline">
                  #{o.id.slice(0, 8).toUpperCase()}
                </Link>
              </td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              <td>{o.customer.email}</td>
              <td><StatusBadge status={o.status} /></td>
              <td>{o.paymentStatus}</td>
              <td className="text-right">{Number(o.total).toFixed(2)}</td>
            </tr>
          ))}
          {!loading && orders.length === 0 && (
            <tr><td colSpan={6} className="py-4 text-gray-500">No orders found.</td></tr>
          )}
        </tbody>
      </table>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>{total} orders</span>
        {totalPages > 1 && (
          <>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-1 border rounded disabled:opacity-40"
            >
              Prev
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2 py-1 border rounded disabled:opacity-40"
            >
              Next
            </button>
          </>
        )}
      </div>
    </div>
  );
}
