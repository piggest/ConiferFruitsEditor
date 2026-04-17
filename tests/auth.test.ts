import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CredentialStore, SERVICE, ACCOUNT } from '../src/auth';

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
