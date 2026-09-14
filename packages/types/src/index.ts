export type TenantStatus = 'PROVISIONING' | 'ACTIVE' | 'PROVISIONING_FAILED' | 'SUSPENDED';

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
}

export interface JwtAccessTokenPayload {
  sub: string;
  tenantId: string;
  role: string;
}
