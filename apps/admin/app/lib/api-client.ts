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
  description?: string | null;
  price: number;
  isActive: boolean;
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
  isActive?: 'true' | 'false';
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
  if (params.isActive) qs.set('isActive', params.isActive);
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

export function createProduct(
  tenantSlug: string,
  accessToken: string,
  data: { name: string; description?: string; price: number; categoryId: string },
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
  data: { name?: string; description?: string; price?: number; categoryId?: string; isActive?: boolean },
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
