const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
// See .env.example: local dev has no subdomain to resolve a tenant from,
// so one dev server instance is pinned to one tenant, same as production
// pins one hostname to one tenant.
const DEV_TENANT_SLUG = process.env.NEXT_PUBLIC_DEV_TENANT_SLUG ?? '';

const SESSION_KEY = 'ecommerce-saas.customer-session';

export interface CustomerSummary {
  id: string;
  email: string;
}

export interface CustomerSession {
  accessToken: string;
  refreshToken: string;
  customer: CustomerSummary;
}

export function getSession(): CustomerSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as CustomerSession) : null;
  } catch {
    return null;
  }
}

export function setSession(session: CustomerSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

interface RequestOptions extends RequestInit {
  accessToken?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken, headers, ...rest } = options;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(DEV_TENANT_SLUG ? { 'x-tenant-slug': DEV_TENANT_SLUG } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? `Request failed with status ${res.status}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Auth ---

export function registerCustomer(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
): Promise<CustomerSummary> {
  return request<CustomerSummary>('/storefront/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, firstName, lastName }),
  });
}

export function loginCustomer(email: string, password: string): Promise<CustomerSession> {
  return request<CustomerSession>('/storefront/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logoutCustomer(refreshToken: string): Promise<{ success: boolean }> {
  return request('/storefront/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

// --- Catalog (public, no auth) ---

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  attributes: Record<string, string> | null;
  priceOverride: string | null;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  categoryId: string;
  isActive: boolean;
  category: Category;
  variants: ProductVariant[];
}

export interface BrowseProductsQuery {
  search?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  pageSize?: number;
}

export interface BrowseProductsResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

function toQueryString<T extends object>(query: T): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function browseProducts(query: BrowseProductsQuery = {}): Promise<BrowseProductsResult> {
  return request(`/storefront/products${toQueryString(query)}`);
}

export function listCategories(): Promise<Category[]> {
  return request('/storefront/categories');
}

export function browseCategoryProducts(
  slug: string,
  query: BrowseProductsQuery = {},
): Promise<BrowseProductsResult> {
  return request(`/storefront/categories/${slug}/products${toQueryString(query)}`);
}

export function getProduct(id: string): Promise<Product> {
  return request(`/storefront/products/${id}`);
}

// --- Customer profile ---

export interface CustomerAddress {
  id: string;
  recipient: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  addresses: CustomerAddress[];
}

export function getMe(accessToken: string): Promise<CustomerProfile> {
  return request('/storefront/me', { accessToken });
}

export function updateMe(
  accessToken: string,
  data: { firstName?: string; lastName?: string },
): Promise<Omit<CustomerProfile, 'addresses'>> {
  return request('/storefront/me', { method: 'PATCH', accessToken, body: JSON.stringify(data) });
}

export interface AddAddressInput {
  recipient: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export function addAddress(accessToken: string, data: AddAddressInput): Promise<CustomerAddress> {
  return request('/storefront/me/addresses', { method: 'POST', accessToken, body: JSON.stringify(data) });
}

export function removeAddress(accessToken: string, id: string): Promise<{ success: boolean }> {
  return request(`/storefront/me/addresses/${id}`, { method: 'DELETE', accessToken });
}

// --- Cart ---

export interface CartItemView {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CartView {
  id: string;
  items: CartItemView[];
  couponCode: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

export function getCart(accessToken: string): Promise<CartView> {
  return request('/storefront/cart', { accessToken });
}

export function addCartItem(accessToken: string, variantId: string, quantity: number): Promise<CartView> {
  return request('/storefront/cart/items', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ variantId, quantity }),
  });
}

export function updateCartItem(accessToken: string, itemId: string, quantity: number): Promise<CartView> {
  return request(`/storefront/cart/items/${itemId}`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify({ quantity }),
  });
}

export function removeCartItem(accessToken: string, itemId: string): Promise<CartView> {
  return request(`/storefront/cart/items/${itemId}`, { method: 'DELETE', accessToken });
}

export function applyCoupon(accessToken: string, code: string): Promise<CartView> {
  return request('/storefront/cart/coupon', { method: 'POST', accessToken, body: JSON.stringify({ code }) });
}

export function removeCoupon(accessToken: string): Promise<CartView> {
  return request('/storefront/cart/coupon', { method: 'DELETE', accessToken });
}

// --- Checkout & orders ---

export interface CheckoutInput {
  shippingRecipient: string;
  shippingLine1: string;
  shippingLine2?: string;
  shippingCity: string;
  shippingRegion?: string;
  shippingPostalCode: string;
  shippingCountry: string;
  deliveryMethod: 'STANDARD' | 'EXPRESS';
  paymentMethod: string;
}

export interface OrderItemView {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: string;
}

export interface OrderView {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryMethod: string;
  shippingRecipient: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingRegion: string | null;
  shippingPostalCode: string;
  shippingCountry: string;
  couponCode: string | null;
  subtotal: string;
  shipping: string;
  total: string;
  createdAt: string;
  items: OrderItemView[];
}

export function checkout(accessToken: string, data: CheckoutInput): Promise<OrderView> {
  return request('/storefront/checkout', { method: 'POST', accessToken, body: JSON.stringify(data) });
}

export function listOrders(accessToken: string): Promise<OrderView[]> {
  return request('/storefront/orders', { accessToken });
}

export function getOrder(accessToken: string, id: string): Promise<OrderView> {
  return request(`/storefront/orders/${id}`, { accessToken });
}

export function cancelOrder(accessToken: string, id: string): Promise<OrderView> {
  return request(`/storefront/orders/${id}/cancel`, { method: 'POST', accessToken });
}
