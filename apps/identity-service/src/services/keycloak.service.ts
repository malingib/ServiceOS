import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'serviceops';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'serviceops-api';
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || 'supersecret';
const KEYCLOAK_ADMIN_USER = process.env.KEYCLOAK_ADMIN_USER || 'admin';
const KEYCLOAK_ADMIN_PASS = process.env.KEYCLOAK_ADMIN_PASS || 'admin';

interface KeycloakUser {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  attributes?: Record<string, string[]>;
}

export class KeycloakService {
  private adminToken: string | null = null;
  private tokenExpiresAt = 0;

  private async getAdminToken(): Promise<string> {
    if (this.adminToken && Date.now() < this.tokenExpiresAt) {
      return this.adminToken;
    }

    const response = await fetch(
      `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: KEYCLOAK_ADMIN_USER,
          password: KEYCLOAK_ADMIN_PASS,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get Keycloak admin token: ${response.status}`);
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    this.adminToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return this.adminToken;
  }

  private async adminRequest<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = await this.getAdminToken();
    const response = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Keycloak admin API error (${response.status}): ${error}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  async createUser(userData: {
    phone: string;
    email?: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
  }): Promise<string> {
    const user = {
      username: userData.phone,
      email: userData.email || `${userData.phone}@serviceops.local`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      enabled: true,
      attributes: {
        tenant_id: [userData.tenantId],
        phone: [userData.phone],
      },
    };

    const created = await this.adminRequest<{ id: string }>(
      'POST',
      '/users',
      user,
    );

    await this.assignRole(created.id, userData.role);
    return created.id;
  }

  async getUser(userId: string): Promise<KeycloakUser | null> {
    try {
      return await this.adminRequest<KeycloakUser>('GET', `/users/${userId}`);
    } catch {
      return null;
    }
  }

  async getUserByUsername(phone: string): Promise<KeycloakUser | null> {
    try {
      const users = await this.adminRequest<KeycloakUser[]>(
        'GET',
        `/users?username=${encodeURIComponent(phone)}&exact=true`,
      );
      return users.length > 0 ? users[0] : null;
    } catch {
      return null;
    }
  }

  async updateUser(
    userId: string,
    data: Partial<{ firstName: string; lastName: string; email: string; attributes: Record<string, string[]> }>,
  ): Promise<void> {
    await this.adminRequest('PUT', `/users/${userId}`, data);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.adminRequest('DELETE', `/users/${userId}`);
  }

  async assignRole(userId: string, role: string): Promise<void> {
    try {
      const roles = await this.adminRequest<Array<{ id: string; name: string }>>(
        'GET',
        '/roles',
      );
      const targetRole = roles.find((r) => r.name === role);
      if (targetRole) {
        await this.adminRequest(
          'POST',
          `/users/${userId}/role-mappings/realm`,
          [{ id: targetRole.id, name: targetRole.name }],
        );
      }
    } catch (error) {
      console.error('Failed to assign role:', error);
    }
  }

  async getClientToken(): Promise<string> {
    const response = await fetch(
      `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: KEYCLOAK_CLIENT_ID,
          client_secret: KEYCLOAK_CLIENT_SECRET,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get client token: ${response.status}`);
    }

    const data = await response.json() as { access_token: string };
    return data.access_token;
  }

  async blacklistToken(jti: string, expiresIn: number): Promise<void> {
    await redis.setex(`bl:${jti}`, expiresIn, '1');
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const result = await redis.get(`bl:${jti}`);
    return result === '1';
  }
}

export const keycloakService = new KeycloakService();
