'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { cancelOrder, getOrder, type OrderView } from '../../lib/api-client';
import { useRequireAuth } from '../../lib/session-context';
import { formatMoney } from '../../lib/format';
import { PageShell } from '../../components/PageShell';
import { Breadcrumb } from '../../components/Breadcrumb';

const STATUS_SEQUENCE = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
const CANCELLABLE = new Set(['PENDING', 'CONFIRMED']);

export default function OrderDetailsPage() {
  const session = useRequireAuth();
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) getOrder(session.accessToken, params.id).then(setOrder);
  }, [session, params.id]);

  if (!session) return null;

  async function handleCancel() {
    setError(null);
    setCancelling(true);
    try {
      const updated = await cancelOrder(session!.accessToken, params.id);
      setOrder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel order');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <PageShell>
      <Breadcrumb current="Order Details" />
      <div className="flex justify-center px-6 pb-24">
        {!order ? (
          <p className="text-text-muted py-16">Loading…</p>
        ) : (
          <div className="w-full max-w-[900px] flex flex-col gap-10">
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-[#2f2f2f]">Order Status</h2>
              {order.status === 'CANCELLED' ? (
                <p className="text-sm font-bold text-red-600">This order was cancelled.</p>
              ) : (
                <div className="flex items-center gap-2">
                  {STATUS_SEQUENCE.map((step, i) => {
                    const currentIndex = STATUS_SEQUENCE.indexOf(order.status);
                    const reached = i <= currentIndex;
                    return (
                      <div key={step} className="flex items-center gap-2 flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            reached ? 'bg-primary text-[#363636]' : 'bg-surface text-text-muted'
                          }`}
                        >
                          {i + 1}
                        </div>
                        <span className={`text-xs font-semibold capitalize ${reached ? 'text-[#2f2f2f]' : 'text-text-muted'}`}>
                          {step.toLowerCase()}
                        </span>
                        {i < STATUS_SEQUENCE.length - 1 && <div className="flex-1 h-0.5 bg-border" />}
                      </div>
                    );
                  })}
                </div>
              )}
              {CANCELLABLE.has(order.status) && (
                <div>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="text-sm font-bold text-link-hover disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel Order'}
                  </button>
                  {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-[#2f2f2f]">Products</h2>
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm border-b border-border pb-3">
                  <span className="text-text-muted">
                    {item.productName ?? item.variantId.slice(0, 8)} × {item.quantity}
                    {item.attributes && Object.keys(item.attributes).length > 0 && (
                      <span className="text-text-muted">
                        {' '}({Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')})
                      </span>
                    )}
                  </span>
                  <span className="font-semibold">{formatMoney(Number(item.unitPrice) * item.quantity)}</span>
                </div>
              ))}
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-[#2f2f2f]">Shipping Information</h2>
              <p className="text-sm text-text-muted">
                {order.shippingRecipient}
                <br />
                {order.shippingLine1}
                {order.shippingLine2 ? `, ${order.shippingLine2}` : ''}
                <br />
                {order.shippingCity}, {order.shippingPostalCode}
                <br />
                {order.shippingCountry} &middot; {order.deliveryMethod === 'EXPRESS' ? 'Express' : 'Standard'}{' '}
                delivery
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-[#2f2f2f]">Tracking</h2>
              <p className="text-sm text-text-muted">
                Placed on {new Date(order.createdAt).toLocaleDateString()}. Carrier tracking isn&apos;t integrated
                yet — order status above reflects the latest update from the store.
              </p>
            </section>

            <div className="flex justify-between text-base font-bold pt-4 border-t border-border">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
