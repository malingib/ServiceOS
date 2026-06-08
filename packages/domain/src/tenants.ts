import type { ISODateTime, UUID } from "./shared";

export type TenantStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";

export interface TenantBranding {
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
}

export interface TenantSettings {
  country: string;
  currency: string;
  timezone: string;
  commissionRateBps?: number;
  paymentProviderPriority?: string[];
}

export interface TenantRecord {
  tenantId: UUID;
  code: string;
  name: string;
  status: TenantStatus;
  country: string;
  currency: string;
  branding: TenantBranding;
  settings: TenantSettings;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface CreateTenantRequest {
  code: string;
  name: string;
  country?: string;
  currency?: string;
  branding?: Partial<TenantBranding>;
  settings?: Partial<TenantSettings>;
}

export interface UpdateTenantRequest {
  name?: string;
  status?: TenantStatus;
  country?: string;
  currency?: string;
  branding?: Partial<TenantBranding>;
  settings?: Partial<TenantSettings>;
}

export interface TenantResolutionInput {
  host?: string;
  tenantCode?: string;
  tenantId?: UUID;
  jwtTenantId?: UUID;
  headerTenantId?: UUID;
}

export interface TenantResolutionResult {
  tenant: TenantRecord;
  source: "subdomain" | "custom_domain" | "jwt" | "header" | "lookup";
}
