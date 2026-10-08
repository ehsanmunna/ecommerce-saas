'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkout, getCart, getMe, type CartView, type CustomerProfile } from '../lib/api-client';
import { useRequireAuth } from '../lib/session-context';
import { formatMoney } from '../lib/format';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';

const PAYMENT_METHODS = [
  { value: 'cash_on_delivery', label: 'Cash on Delivery' },
  { value: 'card_on_delivery', label: 'Card on Delivery' },
];

export default function CheckoutPage() {
  const session = useRequireAuth();
  const router = useRouter();

  const [cart, setCart] = useState<CartView | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [recipient, setRecipient] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].value);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session) return;
    getCart(session.accessToken).then(setCart);
    getMe(session.accessToken).then((p) => {
      setProfile(p);
      const defaultAddress = p.addresses.find((a) => a.isDefault) ?? p.addresses[0];
      if (defaultAddress) {
        setRecipient(defaultAddress.recipient);
        setLine1(defaultAddress.line1);
        setLine2(defaultAddress.line2 ?? '');
        setCity(defaultAddress.city);
        setRegion(defaultAddress.region ?? '');
        setPostalCode(defaultAddress.postalCode);
        setCountry(defaultAddress.country);
      }
    });
  }, [session]);

  if (!session) return null;

  function applyAddress(id: string) {
    const address = profile?.addresses.find((a) => a.id === id);
    if (!address) return;
    setRecipient(address.recipient);
    setLine1(address.line1);
    setLine2(address.line2 ?? '');
    setCity(address.city);
    setRegion(address.region ?? '');
    setPostalCode(address.postalCode);
    setCountry(address.country);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const order = await checkout(session!.accessToken, {
        shippingRecipient: recipient,
        shippingLine1: line1,
        shippingLine2: line2 || undefined,
        shippingCity: city,
        shippingRegion: region || undefined,
        shippingPostalCode: postalCode,
        shippingCountry: country,
        deliveryMethod,
        paymentMethod,
      });
      router.push(`/order-confirmation/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <Breadcrumb current="Checkout" />
      <div className="flex flex-col items-center px-6 pb-8">
        <h1 className="font-heading text-4xl font-bold text-[#2f2f2f]">Checkout</h1>
      </div>

      {!cart || !profile ? (
        <div className="py-24 text-center text-text-muted">Loading…</div>
      ) : cart.items.length === 0 ? (
        <div className="py-24 text-center text-text-muted">Your cart is empty.</div>
      ) : (
        <form onSubmit={handleSubmit} className="flex justify-center px-6 pb-24">
          <div className="w-full max-w-[1200px] grid gap-12" style={{ gridTemplateColumns: 'minmax(0,1fr) 380px' }}>
            <div className="flex flex-col gap-10">
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-bold text-[#2f2f2f]">Customer Information</h2>
                <p className="text-sm text-text-muted">
                  {[profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email} &middot;{' '}
                  {profile.email}
                </p>
              </section>

              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-[#2f2f2f]">Shipping Address</h2>

                {profile.addresses.length > 0 && (
                  <div className="flex gap-3 flex-wrap">
                    {profile.addresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => applyAddress(address.id)}
                        className="text-xs font-semibold border-2 border-border rounded-[10px] px-3 py-2 hover:border-primary"
                      >
                        {address.recipient} — {address.city}
                      </button>
                    ))}
                  </div>
                )}

                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Recipient name"
                  required
                  className="h-12 rounded-[10px] border-2 border-border px-4 text-sm"
                />
                <input
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Street address"
                  required
                  className="h-12 rounded-[10px] border-2 border-border px-4 text-sm"
                />
                <input
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Apt, suite, etc. (optional)"
                  className="h-12 rounded-[10px] border-2 border-border px-4 text-sm"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    required
                    className="h-12 rounded-[10px] border-2 border-border px-4 text-sm"
                  />
                  <input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="State / Province"
                    className="h-12 rounded-[10px] border-2 border-border px-4 text-sm"
                  />
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="ZIP / Postal code"
                    required
                    className="h-12 rounded-[10px] border-2 border-border px-4 text-sm"
                  />
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                    required
                    className="h-12 rounded-[10px] border-2 border-border px-4 text-sm"
                  />
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-bold text-[#2f2f2f]">Delivery Method</h2>
                {(['STANDARD', 'EXPRESS'] as const).map((method) => (
                  <label key={method} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={deliveryMethod === method}
                      onChange={() => setDeliveryMethod(method)}
                    />
                    <span className="text-sm font-medium">{method === 'STANDARD' ? 'Standard' : 'Express'}</span>
                  </label>
                ))}
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-bold text-[#2f2f2f]">Payment Method</h2>
                <p className="text-xs text-text-muted">
                  Online payment isn&apos;t connected yet — orders are recorded with payment pending.
                </p>
                {PAYMENT_METHODS.map((method) => (
                  <label key={method.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                    />
                    <span className="text-sm font-medium">{method.label}</span>
                  </label>
                ))}
              </section>
            </div>

            <div className="flex flex-col gap-4 h-fit rounded-2xl border-2 border-border p-6">
              <h2 className="text-lg font-bold text-[#2f2f2f]">Order Summary</h2>
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-text-muted">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="font-semibold">{formatMoney(item.lineTotal)}</span>
                </div>
              ))}
              <div className="flex flex-col gap-2 text-sm pt-3 border-t border-border">
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

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="h-[51px] rounded-2xl bg-primary hover:bg-primary-hover font-bold text-[#363636] disabled:opacity-50"
              >
                {submitting ? 'Placing order…' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      )}
    </PageShell>
  );
}
