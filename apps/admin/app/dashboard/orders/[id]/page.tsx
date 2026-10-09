'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  AdminOrder,
  cancelOrder,
  getOrder,
  getSession,
  updateOrderStatus,
} from '../../../lib/api-client';

const STATUS_SEQUENCE = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
const CANCELLABLE = new Set(['PENDING', 'CONFIRMED']);

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const session = getSession();
      if (!session) throw new Error('Not signed in');
      setOrder(await getOrder(session.tenantSlug, session.accessToken, params.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    }
  }, [params.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAdvance() {
    if (!order) return;
    const idx = STATUS_SEQUENCE.indexOf(order.status);
    if (idx === -1 || idx >= STATUS_SEQUENCE.length - 1) return;
    const next = STATUS_SEQUENCE[idx + 1];
    setError(null);
    setActing(true);
    try {
      const session = getSession();
      if (!session) throw new Error('Not signed in');
      await updateOrderStatus(session.tenantSlug, session.accessToken, params.id, next);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActing(false);
    }
  }

  async function handleCancel() {
    if (!order) return;
    if (!window.confirm('Cancel this order? This restores inventory and cannot be undone.')) return;
    setError(null);
    setActing(true);
    try {
      const session = getSession();
      if (!session) throw new Error('Not signed in');
      await cancelOrder(session.tenantSlug, session.accessToken, params.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setActing(false);
    }
  }

  if (error && !order) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!order) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  const idx = STATUS_SEQUENCE.indexOf(order.status);
  const nextStatus = idx >= 0 && idx < STATUS_SEQUENCE.length - 1 ? STATUS_SEQUENCE[idx + 1] : null;
  const canCancel = CANCELLABLE.has(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
        <div className="flex gap-3">
          {nextStatus && (
            <button
              onClick={handleAdvance}
              disabled={acting}
              className="rounded bg-gray-900 text-white px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Advance to {nextStatus}
            </button>
          )}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={acting}
              className="rounded bg-red-600 text-white px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded border p-4 space-y-1">
          <p className="text-sm font-semibold">Status</p>
          <p className="text-sm">{order.status}</p>
        </div>
        <div className="rounded border p-4 space-y-1">
          <p className="text-sm font-semibold">Payment</p>
          <p className="text-sm">{order.paymentStatus} via {order.paymentMethod}</p>
        </div>
        <div className="rounded border p-4 space-y-1">
          <p className="text-sm font-semibold">Customer</p>
          <p className="text-sm">{order.customer.email}</p>
          {order.customer.firstName && (
            <p className="text-sm text-gray-500">{order.customer.firstName} {order.customer.lastName}</p>
          )}
        </div>
        <div className="rounded border p-4 space-y-1">
          <p className="text-sm font-semibold">Shipping</p>
          <p className="text-sm">
            {order.shippingRecipient}<br />
            {order.shippingLine1}<br />
            {order.shippingLine2 && <>{order.shippingLine2}<br /></>}
            {order.shippingCity}, {order.shippingPostalCode}<br />
            {order.shippingCountry}
          </p>
        </div>
      </div>

      <div className="rounded border p-4">
        <p className="text-sm font-semibold mb-3">Items</p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Product</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th className="text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-2">
                  {item.productName}
                  {item.attributes && Object.keys(item.attributes).length > 0 && (
                    <span className="text-gray-500 text-xs ml-2">
                      ({Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')})
                    </span>
                  )}
                </td>
                <td>{item.quantity}</td>
                <td>{Number(item.unitPrice).toFixed(2)}</td>
                <td className="text-right">{(Number(item.unitPrice) * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded border p-4 space-y-1">
        <p className="text-sm font-semibold">Totals</p>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{Number(order.subtotal).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>{Number(order.shipping).toFixed(2)}</span>
        </div>
        {order.couponCode && (
          <div className="flex justify-between text-sm">
            <span>Coupon</span>
            <span>{order.couponCode}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold pt-2 border-t">
          <span>Total</span>
          <span>{Number(order.total).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
