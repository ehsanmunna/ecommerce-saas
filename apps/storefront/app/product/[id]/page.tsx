'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  addCartItem,
  browseCategoryProducts,
  getProduct,
  ApiError,
  type Product,
  type ProductVariant,
} from '../../lib/api-client';
import { useSession } from '../../lib/session-context';
import { formatMoney } from '../../lib/format';
import { PageShell } from '../../components/PageShell';
import { Breadcrumb } from '../../components/Breadcrumb';
import { ProductCard } from '../../components/ProductCard';

function variantAttrs(variant: ProductVariant): Record<string, string> {
  return (variant.attributes as Record<string, string> | null) ?? {};
}

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useSession();

  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<'idle' | 'adding' | 'added' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setNotFound(false);
    setProduct(null);
    getProduct(params.id)
      .then((p) => {
        setProduct(p);
        setSelectedAttrs(variantAttrs(p.variants[0]));
        browseCategoryProducts(p.category.slug, { pageSize: 5 }).then((result) => {
          setRelated(result.items.filter((item) => item.id !== p.id).slice(0, 4));
        });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setErrorMessage(err instanceof Error ? err.message : 'Failed to load product');
      });
  }, [params.id]);

  const attributeKeys = useMemo(() => {
    if (!product) return [];
    const keys = new Set<string>();
    product.variants.forEach((v) => Object.keys(variantAttrs(v)).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!product) return null;
    if (attributeKeys.length === 0) return product.variants[0] ?? null;
    return (
      product.variants.find((v) => attributeKeys.every((k) => variantAttrs(v)[k] === selectedAttrs[k])) ?? null
    );
  }, [product, attributeKeys, selectedAttrs]);

  async function handleAddToCart() {
    if (!selectedVariant) return;
    if (!session) {
      router.push(`/login?redirect=/product/${params.id}`);
      return;
    }
    setStatus('adding');
    try {
      await addCartItem(session.accessToken, selectedVariant.id, quantity);
      setStatus('added');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Could not add to cart');
    }
  }

  if (notFound) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-32 px-6 text-center">
          <h1 className="font-heading text-3xl font-bold text-[#2f2f2f]">Product not found</h1>
          <p className="text-text-muted">This product doesn&apos;t exist or is no longer available.</p>
          <Link href="/products" className="font-bold text-link-hover">
            Back to Shop
          </Link>
        </div>
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell>
        <div className="py-32 text-center text-text-muted">Loading…</div>
      </PageShell>
    );
  }

  const price = selectedVariant?.priceOverride ?? product.price;
  const outOfStock = !selectedVariant || selectedVariant.stock <= 0;

  return (
    <PageShell>
      <Breadcrumb current={product.name} />
      <div className="flex justify-center px-6 pb-24">
        <div className="w-full max-w-[1592px] grid gap-16" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#cdfefb]">
            <Image src="/assets/product.jpg" alt={product.name} fill className="object-cover" />
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <div className="text-sm text-text-muted mb-2">{product.category.name}</div>
              <h1 className="font-heading text-3xl font-bold text-[#2f2f2f] mb-3">{product.name}</h1>
              <div className="text-2xl font-bold text-[#252b42]">{formatMoney(price)}</div>
            </div>

            {product.description && <p className="text-sm text-[#373737] leading-relaxed">{product.description}</p>}

            {attributeKeys.map((key) => {
              const values = Array.from(
                new Set(product.variants.map((v) => variantAttrs(v)[key]).filter((v): v is string => Boolean(v))),
              );
              return (
                <div key={key} className="flex flex-col gap-3">
                  <span className="text-base font-bold text-[#2f2f2f] capitalize">{key}</span>
                  <div className="flex gap-3 flex-wrap">
                    {values.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedAttrs((prev) => ({ ...prev, [key]: value }))}
                        className={`h-11 px-5 rounded-[10px] border-2 text-sm font-semibold ${
                          selectedAttrs[key] === value
                            ? 'border-primary bg-primary/20 text-[#2f2f2f]'
                            : 'border-border text-[#373737]'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center gap-4">
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 h-12 rounded-[10px] border-2 border-border text-center"
              />
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={outOfStock || status === 'adding'}
                className="flex-1 h-[51px] rounded-[20px] bg-primary hover:bg-primary-hover font-bold text-[#363636] disabled:opacity-50"
              >
                {outOfStock ? 'Out of Stock' : status === 'adding' ? 'Adding…' : 'Add to Cart'}
              </button>
            </div>

            {status === 'added' && (
              <p className="text-sm font-bold text-success">
                Added to cart —{' '}
                <Link href="/cart" className="underline">
                  view cart
                </Link>
              </p>
            )}
            {status === 'error' && errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="flex flex-col items-center px-6 pb-24">
          <h2 className="font-heading text-3xl font-bold text-center text-[#2f2f2f] mb-14">You May Also Like</h2>
          <div className="w-full max-w-[1650px] grid gap-10" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
