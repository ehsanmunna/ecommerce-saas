const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const PLATFORM_SESSION_KEY = 'ecommerce-saas.platform-session';

export interface PlatformSession {
  accessToken: string;
  email: string;
}

export function getPlatformSession(): PlatformSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PLATFORM_SESSION_KEY);
    return raw ? (JSON.parse(raw) as PlatformSession) : null;
  } catch {
    return null;
  }
}

export function setPlatformSession(session: PlatformSession): void {
  window.localStorage.setItem(PLATFORM_SESSION_KEY, JSON.stringify(session));
}

export function clearPlatformSession(): void {
  window.localStorage.removeItem(PLATFORM_SESSION_KEY);
}

async function platformRequest<T>(path: string, options: RequestInit & { accessToken?: string } = {}): Promise<T> {
  const { accessToken, ...rest } = options;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(rest.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface PlatformLoginResponse {
  accessToken: string;
  admin: { id: string; email: string };
}

export function platformLogin(email: string, password: string): Promise<PlatformLoginResponse> {
  return platformRequest<PlatformLoginResponse>('/platform/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export interface PlatformTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  databaseName: string;
  ownerEmail: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantListResponse {
  items: PlatformTenant[];
  total: number;
  page: number;
  pageSize: number;
}

export function fetchPlatformTenants(params: { status?: string; page?: number }, accessToken: string): Promise<TenantListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  return platformRequest<TenantListResponse>(`/platform/tenants?${query.toString()}`, { accessToken });
}

export function fetchPlatformTenant(id: string, accessToken: string): Promise<PlatformTenant> {
  return platformRequest<PlatformTenant>(`/platform/tenants/${id}`, { accessToken });
}

export interface CreatePlatformTenantInput {
  companyName: string;
  slug: string;
  ownerEmail: string;
  ownerPassword: string;
  plan: string;
}

export function createPlatformTenant(data: CreatePlatformTenantInput, accessToken: string): Promise<PlatformTenant> {
  return platformRequest<PlatformTenant>('/platform/tenants', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(data),
  });
}

export function updateTenantStatus(id: string, status: string, accessToken: string): Promise<PlatformTenant> {
  return platformRequest<PlatformTenant>(`/platform/tenants/${id}/status`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify({ status }),
  });
}


export function deleteTenant(id: string, accessToken: string): Promise<PlatformTenant> {
  return platformRequest<PlatformTenant>(`/platform/tenants/${id}`, {
    method: 'DELETE',
    accessToken,
  });
}

export function updateTenantPlan(id: string, plan: string, accessToken: string): Promise<PlatformTenant> {
  return platformRequest<PlatformTenant>(`/platform/tenants/${id}/plan`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify({ plan }),
  });
}

export function resendVerificationForTenant(id: string, accessToken: string): Promise<PlatformTenant> {
  return platformRequest<PlatformTenant>(`/platform/tenants/${id}/resend-verification`, {
    method: 'POST',
    accessToken,
  });
}

export function revokeVerificationToken(id: string, accessToken: string): Promise<PlatformTenant> {
  return platformRequest<PlatformTenant>(`/platform/tenants/${id}/revoke-verification-token`, {
    method: 'POST',
    accessToken,
  });
}

export function retryProvisioning(id: string, accessToken: string): Promise<PlatformTenant> {
  return platformRequest<PlatformTenant>(`/platform/tenants/${id}/retry-provisioning`, {
    method: 'POST',
    accessToken,
  });
}
