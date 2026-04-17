import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CredentialStore, SERVICE, ACCOUNT, setHttpClient, resetHttpClient } from '../src/auth';
import { startDeviceFlow } from '../src/auth';
import { pollAccessToken } from '../src/auth';

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
  afterEach(() => { resetHttpClient(); });

  it('requests device code from GitHub', async () => {
    let capturedUrl = '';
    let capturedInit: any = {};
    setHttpClient(async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          device_code: 'abc',
          user_code: '1234-ABCD',
          verification_uri: 'https://github.com/login/device',
          expires_in: 900,
          interval: 5,
        }),
      };
    });

    const result = await startDeviceFlow('test-client-id');

    expect(capturedUrl).toBe('https://github.com/login/device/code');
    expect(capturedInit.method).toBe('POST');
    expect(result.user_code).toBe('1234-ABCD');
  });
});

describe('pollAccessToken', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); resetHttpClient(); });

  it('returns access token after authorization_pending', async () => {
    let callCount = 0;
    setHttpClient(async () => {
      callCount++;
      if (callCount === 1) {
        return { ok: true, status: 200, json: async () => ({ error: 'authorization_pending' }) };
      }
      return { ok: true, status: 200, json: async () => ({ access_token: 'gho_test', token_type: 'bearer', scope: 'repo' }) };
    });

    const promise = pollAccessToken('cid', 'dev', 1, 10);
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;
    expect(result.access_token).toBe('gho_test');
    expect(callCount).toBe(2);
  });

  it('throws on non-OK HTTP response', async () => {
    setHttpClient(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    const promise = pollAccessToken('cid', 'dev', 1, 10);
    const advancePromise = vi.advanceTimersByTimeAsync(1000);
    await expect(promise).rejects.toThrow(/HTTP 500/);
    await advancePromise;
  });
});
