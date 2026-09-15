'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  addAddress,
  getMe,
  listOrders,
  logoutCustomer,
  removeAddress,
  updateMe,
  type AddAddressInput,
  type CustomerProfile,
  type OrderView,
} from '../lib/api-client';
import { useRequireAuth, useSession } from '../lib/session-context';
import { formatMoney } from '../lib/format';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';

const EMPTY_ADDRESS: AddAddressInput = {
  recipient: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  isDefault: false,
};

export default function AccountPage() {
  const session = useRequireAuth();
  const { logout } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [newAddress, setNewAddress] = useState<AddAddressInput>(EMPTY_ADDRESS);
  const [addingAddress, setAddingAddress] = useState(false);

  useEffect(() => {
    if (!session) return;
    getMe(session.accessToken).then((p) => {
      setProfile(p);
      setFirstName(p.firstName ?? '');
      setLastName(p.lastName ?? '');
    });
    listOrders(session.accessToken).then(setOrders);
  }, [session]);

  if (!session) return null;

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    setProfileSaved(false);
    await updateMe(session!.accessToken, { firstName, lastName });
    setProfileSaved(true);
  }

  async function handleAddAddress(event: FormEvent) {
    event.preventDefault();
    setAddingAddress(true);
    try {
      const address = await addAddress(session!.accessToken, newAddress);
      setProfile((prev) => (prev ? { ...prev, addresses: [...prev.addresses, address] } : prev));
      setNewAddress(EMPTY_ADDRESS);
    } finally {
      setAddingAddress(false);
    }
  }

  async function handleRemoveAddress(id: string) {
    await removeAddress(session!.accessToken, id);
    setProfile((prev) => (prev ? { ...prev, addresses: prev.addresses.filter((a) => a.id !== id) } : prev));
  }

  async function handleSignOut() {
    await logoutCustomer(session!.refreshToken).catch(() => undefined);
    logout();
    router.push('/');
  }

  return (
    <PageShell>
      <Breadcrumb current="My Account" />
      <div className="flex justify-center px-6 pb-24">
        <div className="w-full max-w-[900px] flex flex-col gap-14">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-4xl font-bold text-[#2f2f2f]">My Account</h1>
            <button type="button" onClick={handleSignOut} className="text-sm font-bold text-link-hover">
              Sign Out
            </button>
          </div>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#2f2f2f]">Profile</h2>
            {!profile ? (
              <p className="text-text-muted text-sm">Loading…</p>
            ) : (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 max-w-[440px]">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="h-11 rounded-[10px] border-2 border-border px-3 text-sm"
                  />
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="h-11 rounded-[10px] border-2 border-border px-3 text-sm"
                  />
                </div>
                <input
                  value={profile.email}
                  disabled
                  className="h-11 rounded-[10px] border-2 border-border px-3 text-sm bg-surface text-text-muted"
                />
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    className="h-11 px-6 rounded-[10px] bg-primary hover:bg-primary-hover font-bold text-[#363636]"
                  >
                    Save Changes
                  </button>
                  {profileSaved && <span className="text-sm font-bold text-success">Profile updated</span>}
                </div>
              </form>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#2f2f2f]">Addresses</h2>
            <div className="flex flex-col gap-3">
              {profile?.addresses.map((address) => (
                <div
                  key={address.id}
                  className="flex items-center justify-between gap-4 rounded-[10px] border-2 border-border p-4"
                >
                  <div className="text-sm">
                    <div className="font-semibold flex items-center gap-2">
                      {address.recipient}
                      {address.isDefault && (
                        <span className="text-xs font-bold text-[#264f14] bg-[#c6f68c] px-2 py-0.5 rounded-[10px]">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-text-muted">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ''}, {address.city} {address.postalCode},{' '}
                      {address.country}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAddress(address.id)}
                    className="text-sm font-bold text-link-hover shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddAddress} className="flex flex-col gap-3 max-w-[440px] pt-2">
              <span className="text-sm font-bold text-[#2f2f2f]">Add a new address</span>
              <input
                value={newAddress.recipient}
                onChange={(e) => setNewAddress((a) => ({ ...a, recipient: e.target.value }))}
                placeholder="Recipient name"
                required
                className="h-11 rounded-[10px] border-2 border-border px-3 text-sm"
              />
              <input
                value={newAddress.line1}
                onChange={(e) => setNewAddress((a) => ({ ...a, line1: e.target.value }))}
                placeholder="Street address"
                required
                className="h-11 rounded-[10px] border-2 border-border px-3 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={newAddress.city}
                  onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))}
                  placeholder="City"
                  required
                  className="h-11 rounded-[10px] border-2 border-border px-3 text-sm"
                />
                <input
                  value={newAddress.postalCode}
                  onChange={(e) => setNewAddress((a) => ({ ...a, postalCode: e.target.value }))}
                  placeholder="ZIP / Postal code"
                  required
                  className="h-11 rounded-[10px] border-2 border-border px-3 text-sm"
                />
                <input
                  value={newAddress.region}
                  onChange={(e) => setNewAddress((a) => ({ ...a, region: e.target.value }))}
                  placeholder="State / Province"
                  className="h-11 rounded-[10px] border-2 border-border px-3 text-sm"
                />
                <input
                  value={newAddress.country}
                  onChange={(e) => setNewAddress((a) => ({ ...a, country: e.target.value }))}
                  placeholder="Country"
                  required
                  className="h-11 rounded-[10px] border-2 border-border px-3 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-text-muted">
                <input
                  type="checkbox"
                  checked={newAddress.isDefault}
                  onChange={(e) => setNewAddress((a) => ({ ...a, isDefault: e.target.checked }))}
                />
                Set as default
              </label>
              <button
                type="submit"
                disabled={addingAddress}
                className="self-start h-11 px-6 rounded-[10px] border-2 border-ink hover:bg-primary hover:border-primary font-bold text-ink disabled:opacity-50"
              >
                {addingAddress ? 'Adding…' : 'Add Address'}
              </button>
            </form>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#2f2f2f]">Orders</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-text-muted">No orders yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-4 rounded-[10px] border-2 border-border p-4"
                  >
                    <div className="text-sm">
                      <div className="font-semibold">Order #{order.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-text-muted capitalize">
                        {order.status.toLowerCase()} &middot; {formatMoney(order.total)}
                      </div>
                    </div>
                    <Link href={`/orders/${order.id}`} className="text-sm font-bold text-[#252b42] shrink-0">
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
