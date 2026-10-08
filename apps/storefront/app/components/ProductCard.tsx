import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '../lib/api-client';
import { formatMoney } from '../lib/format';

/**
 * The `Product` model has no image field (no image storage exists yet -
 * see system-design.md §27, not built). Every card uses the design's
 * placeholder product image rather than inventing a field the backend
 * doesn't have.
 */
export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="rounded-card bg-white shadow-[0px_4px_10px_0px_rgba(0,0,0,0.1)] hover:shadow-[0px_10px_24px_0px_rgba(0,0,0,0.14)] p-6 flex flex-col gap-6 transition-shadow"
    >
      <div className="relative h-[220px] rounded-[10px] overflow-hidden bg-[#cdfefb]">
        <Image src="/assets/product.jpg" alt={product.name} fill className="object-cover" />
      </div>
      <div className="flex flex-row justify-between items-start gap-4">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="text-base font-bold leading-tight text-[#252b42] truncate">{product.name}</div>
          <div className="text-sm text-text-muted">{product.category.name}</div>
          <div className="text-base font-bold text-[#252b42]">{formatMoney(product.salePrice ?? product.regularPrice)}</div>
        </div>
        <div className="w-10 h-[39px] rounded-full bg-ink hover:bg-ink-hover shrink-0 flex items-center justify-center">
          <span className="font-heading text-white text-2xl leading-none -mt-0.5">+</span>
        </div>
      </div>
    </Link>
  );
}
