import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CredentialStore, SERVICE, ACCOUNT } from '../src/auth';
import { startDeviceFlow } from '../src/auth';

vi.mock('keytar', () => ({
  default: {
    getPassword: vi.fn(),
    setPassword: vi.fn(),
    deletePassword: vi.fn(),
  },
}));

import keytar from 'keytar';

describe('CredentialStore', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('stores token under service name', async () => {
    const store = new CredentialStore();
    await store.saveToken('ghp_xxx');
    expect(keytar.setPassword).toHaveBeenCalledWith(SERVICE, ACCOUNT, 'ghp_xxx');
  });

  it('retrieves stored token', async () => {
    (keytar.getPassword as any).mockResolvedValue('ghp_xxx');
    const store = new CredentialStore();
    expect(await store.getToken()).toBe('ghp_xxx');
  });

  it('returns null when no token stored', async () => {
    (keytar.getPassword as any).mockResolvedValue(null);
    const store = new CredentialStore();
    expect(await store.getToken()).toBeNull();
  });
});

describe('startDeviceFlow', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('requests device code from GitHub', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        device_code: 'abc',
        user_code: '1234-ABCD',
        verification_uri: 'https://github.com/login/device',
        expires_in: 900,
        interval: 5,
      }),
    } as any);

    const result = await startDeviceFlow('test-client-id');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://github.com/login/device/code',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.user_code).toBe('1234-ABCD');
  });
});
