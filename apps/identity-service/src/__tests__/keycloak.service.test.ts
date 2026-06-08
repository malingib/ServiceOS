import { KeycloakService } from '../services/keycloak.service';

jest.mock('ioredis', () => {
  const { RedisMock } = jest.requireActual('@mobiwave/testing');
  return { __esModule: true, default: jest.fn(() => new (RedisMock as any)()) };
});

describe('KeycloakService', () => {
  let keycloakService: KeycloakService;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    keycloakService = new KeycloakService();
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'admin-token', expires_in: 3600 }),
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createUser', () => {
    it('should create a user in Keycloak', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'kc-user-id' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'role-id', name: 'CUSTOMER' }] })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const userId = await keycloakService.createUser({
        phone: '+254700100200',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        tenantId: 'tenant-1',
      });

      expect(userId).toBe('kc-user-id');
    });

    it('should throw when Keycloak API fails', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Internal error' });

      await expect(keycloakService.createUser({
        phone: '+254700100200',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        tenantId: 'tenant-1',
      })).rejects.toThrow('Keycloak admin API error (500): Internal error');
    });
  });

  describe('getUser', () => {
    it('should return user by ID', async () => {
      const expectedUser = { id: 'kc-user-id', username: '+254700100200', enabled: true };
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => expectedUser });

      const user = await keycloakService.getUser('kc-user-id');

      expect(user).toEqual(expect.objectContaining({ id: 'kc-user-id' }));
    });

    it('should return null for non-existent user', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Not found'));

      const user = await keycloakService.getUser('non-existent');

      expect(user).toBeNull();
    });
  });

  describe('assignRole', () => {
    it('should assign role to user', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'role-id', name: 'WORKER' }] })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      await expect(keycloakService.assignRole('kc-user-id', 'WORKER')).resolves.not.toThrow();
    });

    it('should not throw when role not found', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      await expect(keycloakService.assignRole('kc-user-id', 'NONEXISTENT')).resolves.not.toThrow();
    });

    it('should handle API error gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'role-id', name: 'WORKER' }] })
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(keycloakService.assignRole('kc-user-id', 'WORKER')).resolves.not.toThrow();
    });
  });

  describe('getClientToken', () => {
    it('should return client token', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'client-token' }),
        });

      const token = await keycloakService.getClientToken();

      expect(token).toBe('client-token');
    });

    it('should throw on failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 401 });

      await expect(keycloakService.getClientToken()).rejects.toThrow('Failed to get client token: 401');
    });
  });

  describe('token blacklist', () => {
    it('should blacklist a token', async () => {
      await expect(keycloakService.blacklistToken('jti-123', 3600)).resolves.not.toThrow();
    });

    it('should check if a token is blacklisted', async () => {
      await keycloakService.blacklistToken('jti-123', 3600);

      const isBlacklisted = await keycloakService.isTokenBlacklisted('jti-123');
      expect(isBlacklisted).toBe(true);
    });

    it('should return false for non-blacklisted token', async () => {
      const isBlacklisted = await keycloakService.isTokenBlacklisted('non-existent');
      expect(isBlacklisted).toBe(false);
    });
  });
});
