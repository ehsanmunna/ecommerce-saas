const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const SESSION_KEY = 'ecommerce-saas.session';

export interface Session {
  tenantSlug: string;
  accessToken: string;
  refreshToken: string;
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

interface RequestOptions extends RequestInit {
  tenantSlug?: string;
  accessToken?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { tenantSlug, accessToken, headers, ...rest } = options;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string };
}

export function login(tenantSlug: string, email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify({ email, password }),
  });
}

export interface MeResponse {
  tenant: { id: string; name: string; slug: string; status: string };
  user: { id: string; email: string; role: string } | null;
}

export function fetchMe(tenantSlug: string, accessToken: string): Promise<MeResponse> {
  return request<MeResponse>('/me', { tenantSlug, accessToken });
}

export interface RegisterTenantRequest {
  companyName: string;
  slug: string;
  ownerEmail: string;
  ownerPassword: string;
  plan: string;
}

export interface RegisterTenantResponse {
  id: string;
  name: string;
  slug: string;
  status: string;
  verificationToken?: string;
}

export function registerTenant(data: RegisterTenantRequest): Promise<RegisterTenantResponse> {
  return request<RegisterTenantResponse>('/tenants/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface CheckSlugResponse {
  available: boolean;
  reason?: 'invalid' | 'reserved' | 'taken';
}

export function checkSlug(slug: string): Promise<CheckSlugResponse> {
  return request<CheckSlugResponse>(`/tenants/check-slug?slug=${encodeURIComponent(slug)}`);
}

export interface VerifyEmailResponse {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  return request<VerifyEmailResponse>('/tenants/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export interface TenantStatusResponse {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export function getTenantStatus(tenantId: string): Promise<TenantStatusResponse> {
  return request<TenantStatusResponse>(`/tenants/${tenantId}/status`);
}

export interface ProductVariant {
  id: string;
  sku: string;
  attributes?: Record<string, string> | null;
  priceOverride?: number | null;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  shortDescription?: string | null;
  description?: string | null;
  regularPrice: number;
  salePrice?: number | null;
  stockQuantity: number;
  mainImage?: string | null;
  status: 'active' | 'draft' | 'archived';
  categoryId: string;
  category?: Category | null;
  variants?: ProductVariant[];
  createdAt?: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListProductsParams {
  search?: string;
  categorySlug?: string;
  status?: 'active' | 'draft' | 'archived';
  page?: number;
  pageSize?: number;
}

export function listProducts(
  tenantSlug: string,
  accessToken: string,
  params: ListProductsParams = {},
): Promise<ProductListResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.categorySlug) qs.set('categorySlug', params.categorySlug);
  if (params.status) qs.set('status', params.status);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<ProductListResponse>(`/products${suffix}`, { tenantSlug, accessToken });
}

export function listCategories(tenantSlug: string, accessToken: string): Promise<Category[]> {
  return request<Category[]>('/categories', { tenantSlug, accessToken });
}

export function createCategory(
  tenantSlug: string,
  accessToken: string,
  data: { name: string; slug: string },
): Promise<Category> {
  return request<Category>('/categories', {
    method: 'POST',
    tenantSlug,
    accessToken,
    body: JSON.stringify(data),
  });
}

export function updateCategory(
  tenantSlug: string,
  accessToken: string,
  id: string,
  data: { name?: string; slug?: string },
): Promise<Category> {
  return request<Category>(`/categories/${id}`, {
    method: 'PATCH',
    tenantSlug,
    accessToken,
    body: JSON.stringify(data),
  });
}

export function createProduct(
  tenantSlug: string,
  accessToken: string,
  data: {
    name: string;
    sku: string;
    shortDescription?: string;
    description?: string;
    regularPrice: number;
    salePrice?: number;
    stockQuantity?: number;
    mainImage?: string;
    status?: 'active' | 'draft' | 'archived';
    categoryId: string;
  },
): Promise<Product> {
  return request<Product>('/products', {
    method: 'POST',
    tenantSlug,
    accessToken,
    body: JSON.stringify(data),
  });
}

export function updateProduct(
  tenantSlug: string,
  accessToken: string,
  id: string,
  data: {
    name?: string;
    sku?: string;
    shortDescription?: string;
    description?: string;
    regularPrice?: number;
    salePrice?: number;
    stockQuantity?: number;
    mainImage?: string;
    status?: 'active' | 'draft' | 'archived';
    categoryId?: string;
  },
): Promise<Product> {
  return request<Product>(`/products/${id}`, {
    method: 'PATCH',
    tenantSlug,
    accessToken,
    body: JSON.stringify(data),
  });
}

export function deactivateProduct(
  tenantSlug: string,
  accessToken: string,
  id: string,
): Promise<Product> {
  return request<Product>(`/products/${id}/deactivate`, {
    method: 'POST',
    tenantSlug,
    accessToken,
  });
}

export function createVariant(
  tenantSlug: string,
  accessToken: string,
  productId: string,
  data: { sku: string; attributes?: Record<string, string>; priceOverride?: number; stock?: number },
): Promise<ProductVariant> {
  return request<ProductVariant>(`/products/${productId}/variants`, {
    method: 'POST',
    tenantSlug,
    accessToken,
    body: JSON.stringify(data),
  });
}

export interface ResendVerificationResponse {
  id: string;
  name: string;
  slug: string;
  status: string;
  verificationToken?: string;
}

export function resendVerificationBySlug(slug: string): Promise<ResendVerificationResponse> {
  return request<ResendVerificationResponse>('/tenants/resend-verification-by-slug', {
    method: 'POST',
    body: JSON.stringify({ slug }),
  });
}

// --- Orders ---

export interface AdminOrderItem {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: string;
  productName: string;
  sku: string | null;
  attributes: Record<string, string> | null;
}

export interface AdminOrder {
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
  updatedAt: string;
  customer: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  items: AdminOrderItem[];
}

export interface AdminOrderListResult {
  items: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListOrdersParams {
  status?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function listOrders(
  tenantSlug: string,
  accessToken: string,
  params: ListOrdersParams = {},
): Promise<AdminOrderListResult> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.paymentStatus) qs.set('paymentStatus', params.paymentStatus);
  if (params.search) qs.set('search', params.search);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<AdminOrderListResult>(`/orders${suffix}`, { tenantSlug, accessToken });
}

export function getOrder(tenantSlug: string, accessToken: string, id: string): Promise<AdminOrder> {
  return request<AdminOrder>(`/orders/${id}`, { tenantSlug, accessToken });
}

export function updateOrderStatus(
  tenantSlug: string,
  accessToken: string,
  id: string,
  status: string,
): Promise<AdminOrder> {
  return request<AdminOrder>(`/orders/${id}/status`, {
    method: 'PATCH',
    tenantSlug,
    accessToken,
    body: JSON.stringify({ status }),
  });
}

export function cancelOrder(
  tenantSlug: string,
  accessToken: string,
  id: string,
): Promise<AdminOrder> {
  return request<AdminOrder>(`/orders/${id}/cancel`, {
    method: 'POST',
    tenantSlug,
    accessToken,
  });
}
