'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../lib/session-context';

export function Header() {
  const router = useRouter();
  const { session } = useSession();
  const [search, setSearch] = useState('');

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const q = search.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  }

  return (
    <>
      <div className="h-[50px] bg-primary flex items-center justify-center">
        <div className="w-full max-w-[1592px] px-6 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Image src="/assets/icon-truck.svg" alt="" width={15} height={11} />
            <span className="text-xs font-bold text-black">Free Shipping on Orders Over $99</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Image src="/assets/icon-return.svg" alt="" width={16} height={16} />
              <span className="text-xs font-bold text-black">30 Days easy return</span>
            </div>
            <Link href="/faq" className="flex items-center gap-2">
              <Image src="/assets/icon-help.svg" alt="" width={16} height={17} />
              <span className="text-xs font-bold text-black">Help Center</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex justify-center py-10">
        <div className="w-full max-w-[1592px] px-6 flex items-center gap-12 flex-wrap">
          <Link href="/" className="shrink-0">
            <Image src="/assets/logo.png" alt="Frozen" width={146} height={32} className="w-[146px] h-8 object-contain" />
          </Link>

          <form onSubmit={handleSearch} className="flex-1 min-w-[280px] flex items-center h-[49px] bg-surface rounded">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your product"
              className="flex-1 h-full bg-transparent border-none outline-none px-4 text-sm text-text placeholder:text-text-muted"
            />
            <button type="submit" className="pr-3 shrink-0" aria-label="Search">
              <Image src="/assets/icon-search.svg" alt="" width={22} height={22} />
            </button>
          </form>

          <div className="flex items-center gap-8 shrink-0">
            {session ? (
              <Link href="/account" className="flex items-center gap-2">
                <Image src="/assets/icon-user.svg" alt="" width={22} height={22} />
                <span className="text-xs font-bold text-black">My Account</span>
              </Link>
            ) : (
              <Link href="/login" className="flex items-center gap-2">
                <Image src="/assets/icon-user.svg" alt="" width={22} height={22} />
                <span className="text-xs font-bold text-black">Sign-in | Sign-up</span>
              </Link>
            )}
            <Link href="/cart" className="flex items-center gap-1">
              <Image src="/assets/icon-cart.svg" alt="" width={22} height={22} />
              <span className="text-xs font-bold text-black">Cart</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
