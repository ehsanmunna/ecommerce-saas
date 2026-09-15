'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getOrder, type OrderView } from '../../lib/api-client';
import { useRequireAuth } from '../../lib/session-context';
import { formatMoney } from '../../lib/format';
import { PageShell } from '../../components/PageShell';

export default function OrderConfirmationPage() {
  const session = useRequireAuth();
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderView | null>(null);

  useEffect(() => {
    if (session) getOrder(session.accessToken, params.id).then(setOrder);
  }, [session, params.id]);

  if (!session) return null;

  return (
    <PageShell>
      <div className="flex justify-center px-6 py-16">
        {!order ? (
          <p className="text-text-muted">Loading…</p>
        ) : (
          <div className="w-full max-w-[720px] flex flex-col gap-8 text-center">
            <div>
              <h1 className="font-heading text-3xl font-bold text-[#2f2f2f] mb-2">Order Confirmed</h1>
              <p className="text-sm text-text-muted">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-left rounded-2xl border-2 border-border p-6">
              <div>
                <div className="text-base font-bold text-[#2f2f2f] mb-2">Payment Status</div>
                <p className="text-sm text-text-muted capitalize">{order.paymentStatus.toLowerCase()}</p>
              </div>
              <div>
                <div className="text-base font-bold text-[#2f2f2f] mb-2">Delivery Information</div>
                <p className="text-sm text-text-muted">
                  {order.shippingRecipient}
                  <br />
                  {order.shippingLine1}
                  {order.shippingLine2 ? `, ${order.shippingLine2}` : ''}
                  <br />
                  {order.shippingCity}, {order.shippingPostalCode}
                  <br />
                  {order.shippingCountry}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-left rounded-2xl border-2 border-border p-6">
              <div className="text-base font-bold text-[#2f2f2f] mb-2">Order Summary</div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Subtotal</span>
                <span className="font-semibold">{formatMoney(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Shipping</span>
                <span className="font-semibold">{formatMoney(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatMoney(order.total)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Link href="/products" className="font-bold text-[#1a1a1a] underline">
                Continue Shopping
              </Link>
              <Link
                href="/"
                className="h-[51px] px-8 rounded-2xl bg-primary hover:bg-primary-hover flex items-center justify-center font-bold text-[#363636]"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
