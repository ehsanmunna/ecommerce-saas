'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  browseCategoryProducts,
  browseProducts,
  listCategories,
  type BrowseProductsQuery,
  type Category,
  type Product,
} from '../lib/api-client';
import { ProductCard } from './ProductCard';

const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: 'Under $25', max: 25 },
  { label: '$25 to $50', min: 25, max: 50 },
  { label: '$50 to $75', min: 50, max: 75 },
  { label: '$75 and above', min: 75 },
];

type SortOption = 'newest' | 'price_asc' | 'price_desc';

/**
 * Shared by the Shop page (all categories, sidebar category picker) and
 * the Category page (fixed category, no picker) - the backend only
 * supports one `categorySlug` filter at a time, not a multi-select, so
 * the sidebar picker is single-select rather than the design's checkbox
 * list.
 */
export function ProductBrowser({ fixedCategorySlug }: { fixedCategorySlug?: string }) {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [categorySlug, setCategorySlug] = useState<string | undefined>(fixedCategorySlug);
  const [priceRangeIndex, setPriceRangeIndex] = useState<number | null>(null);
  const [sort, setSort] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fixedCategorySlug) {
      listCategories().then(setCategories);
    }
  }, [fixedCategorySlug]);

  useEffect(() => {
    setLoading(true);
    const priceRange = priceRangeIndex !== null ? PRICE_RANGES[priceRangeIndex] : undefined;
    const query: BrowseProductsQuery = {
      search: search || undefined,
      categorySlug: fixedCategorySlug ?? categorySlug,
      minPrice: priceRange?.min,
      maxPrice: priceRange?.max,
      sort,
      page,
      pageSize: 8,
    };
    const fetcher = fixedCategorySlug
      ? browseCategoryProducts(fixedCategorySlug, query)
      : browseProducts(query);
    fetcher
      .then((result) => {
        setItems((prev) => (page === 1 ? result.items : [...prev, ...result.items]));
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  }, [fixedCategorySlug, categorySlug, search, priceRangeIndex, sort, page]);

  function resetAndFilter(update: () => void) {
    update();
    setPage(1);
  }

  const hasActiveFilters = search.length > 0 || (!fixedCategorySlug && !!categorySlug) || priceRangeIndex !== null;
  const canLoadMore = items.length < total;

  return (
    <div className="flex justify-center px-6 pb-24">
      <div className="w-full max-w-[1592px] grid gap-12" style={{ gridTemplateColumns: '260px minmax(0,1fr)' }}>
        <aside className="flex flex-col gap-9 min-w-0">
          <div className="flex flex-col gap-4">
            <span className="text-base font-bold text-[#2f2f2f]">Search</span>
            <div className="flex items-center h-11 bg-surface rounded-[10px] px-3">
              <input
                value={search}
                onChange={(e) => resetAndFilter(() => setSearch(e.target.value))}
                placeholder="Search products"
                className="flex-1 bg-transparent border-none outline-none text-sm"
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          {!fixedCategorySlug && (
            <>
              <div className="flex flex-col gap-4">
                <span className="text-base font-bold text-[#2f2f2f]">Category</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!categorySlug}
                    onChange={() => resetAndFilter(() => setCategorySlug(undefined))}
                  />
                  <span className="text-sm font-medium text-[#373737]">All categories</span>
                </label>
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={categorySlug === cat.slug}
                      onChange={() => resetAndFilter(() => setCategorySlug(cat.slug))}
                    />
                    <span className="text-sm font-medium text-[#373737]">{cat.name}</span>
                  </label>
                ))}
              </div>
              <div className="h-px bg-border" />
            </>
          )}

          <div className="flex flex-col gap-4">
            <span className="text-base font-bold text-[#2f2f2f]">Price</span>
            {PRICE_RANGES.map((range, i) => (
              <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={priceRangeIndex === i}
                  onChange={() => resetAndFilter(() => setPriceRangeIndex(i))}
                />
                <span className="text-sm font-medium text-[#373737]">{range.label}</span>
              </label>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() =>
                resetAndFilter(() => {
                  setSearch('');
                  setCategorySlug(undefined);
                  setPriceRangeIndex(null);
                })
              }
              className="text-left text-sm font-bold text-link-hover"
            >
              Clear all filters
            </button>
          )}
        </aside>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center justify-between gap-6 flex-wrap mb-8">
            <span className="text-sm text-text-muted">{total} products found</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#2f2f2f]">Sort by</span>
              <select
                value={sort}
                onChange={(e) => resetAndFilter(() => setSort(e.target.value as SortOption))}
                className="h-11 px-3 rounded-[10px] border-2 border-border bg-white text-sm font-semibold cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {items.length === 0 && !loading ? (
            <div className="flex flex-col items-center gap-4 py-24">
              <span className="text-xl font-bold text-[#2f2f2f]">No products found</span>
              <span className="text-sm text-text-muted">Try adjusting your search or filters</span>
            </div>
          ) : (
            <div className="grid gap-10" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {loading && <div className="flex justify-center py-14 text-text-muted text-sm">Loading…</div>}

          {!loading && canLoadMore && (
            <div className="flex justify-center pt-14">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="h-[51px] px-10 rounded-2xl border-2 border-ink hover:bg-primary hover:border-primary font-bold text-ink"
              >
                Load more
              </button>
            </div>
          )}
          {!loading && !canLoadMore && items.length > 0 && (
            <div className="flex justify-center pt-12 text-sm text-text-muted">
              You&apos;ve reached the end of the list
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
