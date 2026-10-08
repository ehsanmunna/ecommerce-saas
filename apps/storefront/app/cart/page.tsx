'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  applyCoupon,
  getCart,
  removeCartItem,
  removeCoupon,
  updateCartItem,
  type CartView,
} from '../lib/api-client';
import { useRequireAuth } from '../lib/session-context';
import { formatMoney } from '../lib/format';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';

export default function CartPage() {
  const session = useRequireAuth();
  const [cart, setCart] = useState<CartView | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) getCart(session.accessToken).then(setCart);
  }, [session]);

  if (!session) return null;

  async function withBusy(fn: () => Promise<CartView>) {
    setBusy(true);
    try {
      setCart(await fn());
    } finally {
      setBusy(false);
    }
  }

  async function handleApplyCoupon() {
    if (!session || !couponInput.trim()) return;
    setCouponError(null);
    try {
      await withBusy(() => applyCoupon(session.accessToken, couponInput.trim()));
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Invalid coupon code');
    }
  }

  return (
    <PageShell>
      <Breadcrumb current="Cart" />
      <div className="flex flex-col items-center px-6 pb-8">
        <h1 className="font-heading text-4xl font-bold text-[#2f2f2f]">Shopping Cart</h1>
      </div>

      {!cart ? (
        <div className="py-24 text-center text-text-muted">Loading…</div>
      ) : cart.items.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-24 px-6">
          <p className="text-xl font-bold text-[#2f2f2f]">Your cart is empty</p>
          <Link
            href="/products"
            className="h-[51px] px-10 rounded-2xl bg-primary hover:bg-primary-hover flex items-center justify-center font-bold text-[#363636]"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex justify-center px-6 pb-24">
          <div className="w-full max-w-[1200px] grid gap-12" style={{ gridTemplateColumns: 'minmax(0,1fr) 380px' }}>
            <div className="flex flex-col gap-6">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-6 pb-6 border-b border-border">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#252b42] truncate">{item.productName}</div>
                    <div className="text-sm text-text-muted">SKU: {item.sku}</div>
                    <div className="text-sm font-bold text-[#252b42] mt-1">{formatMoney(item.unitPrice)}</div>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    disabled={busy}
                    onChange={(e) => {
                      const quantity = Math.max(1, Number(e.target.value) || 1);
                      withBusy(() => updateCartItem(session.accessToken, item.id, quantity));
                    }}
                    className="w-16 h-11 rounded-[10px] border-2 border-border text-center"
                  />
                  <div className="w-24 text-right font-bold text-[#252b42]">{formatMoney(item.lineTotal)}</div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => withBusy(() => removeCartItem(session.accessToken, item.id))}
                    className="text-sm font-bold text-link-hover"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-5 h-fit rounded-2xl border-2 border-border p-6">
              <h2 className="text-lg font-bold text-[#2f2f2f]">Order Summary</h2>

              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 h-11 rounded-[10px] border-2 border-border px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={busy}
                  className="h-11 px-4 rounded-[10px] bg-ink hover:bg-ink-hover text-white text-sm font-bold"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-sm text-red-600">{couponError}</p>}
              {cart.couponCode && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Coupon: {cart.couponCode}</span>
                  <button
                    type="button"
                    onClick={() => withBusy(() => removeCoupon(session.accessToken))}
                    className="font-bold text-link-hover"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2 text-sm pt-2 border-t border-border">
                <div className="flex justify-between">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="font-semibold">{formatMoney(cart.subtotal)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Discount</span>
                    <span className="font-semibold text-success">-{formatMoney(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted">Shipping</span>
                  <span className="font-semibold">{formatMoney(cart.shipping)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{formatMoney(cart.total)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="h-[51px] rounded-2xl bg-primary hover:bg-primary-hover flex items-center justify-center font-bold text-[#363636]"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
