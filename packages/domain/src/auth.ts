import type { ISODateTime, UUID } from "./shared";

export type AuthMethod = "OTP" | "PASSWORD" | "SSO" | "REFRESH_TOKEN";
export type AuthRole =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "OPS_MANAGER"
  | "DISPATCHER"
  | "ACCOUNTANT"
  | "SUPPORT"
  | "WORKER"
  | "CUSTOMER";

export interface TenantMembership {
  tenantId: UUID;
  role: AuthRole;
  isDefault?: boolean;
}

export interface AuthClaims {
  sub: UUID;
  tenantId?: UUID;
  sessionId: UUID;
  roles: AuthRole[];
  permissions: string[];
  authMethod: AuthMethod;
}

export interface AuthUserProfile {
  userId: UUID;
  fullName: string;
  phone: string;
  email?: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  memberships: TenantMembership[];
}

export interface RegisterRequest {
  fullName: string;
  phone: string;
  email?: string;
  tenantId?: UUID;
  inviteCode?: string;
}

export interface LoginRequest {
  identifier: string;
  method: AuthMethod;
  tenantId?: UUID;
  otp?: string;
  password?: string;
}

export interface OtpRequest {
  phone: string;
  purpose: "login" | "register" | "reset";
  tenantId?: UUID;
}

export interface OtpVerifyRequest {
  phone: string;
  code: string;
  challengeId: string;
  purpose: "login" | "register" | "reset";
}

export interface RefreshRequest {
  refreshToken: string;
  tenantId?: UUID;
}

export interface LogoutRequest {
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthTokenPair {
  tokenType: "Bearer";
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface AuthSession {
  sessionId: UUID;
  userId: UUID;
  tenantId?: UUID;
  method: AuthMethod;
  createdAt: ISODateTime;
  expiresAt: ISODateTime;
  revokedAt?: ISODateTime;
}

export interface MeResponse {
  user: AuthUserProfile;
  tokens?: AuthTokenPair;
}
