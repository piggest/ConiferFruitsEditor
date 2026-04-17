import keytar from 'keytar';

export const SERVICE = 'DocMDTest-desktop';
export const ACCOUNT = 'github-token';

export class CredentialStore {
  async saveToken(token: string): Promise<void> {
    await keytar.setPassword(SERVICE, ACCOUNT, token);
  }
  async getToken(): Promise<string | null> {
    return keytar.getPassword(SERVICE, ACCOUNT);
  }
  async clearToken(): Promise<void> {
    await keytar.deletePassword(SERVICE, ACCOUNT);
  }
}

export type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
};

export async function startDeviceFlow(clientId: string): Promise<DeviceCodeResponse> {
  let res: Response;
  try {
    res = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, scope: 'repo' }),
    });
  } catch (e) {
    throw new Error(`GitHub への接続に失敗: ${(e as Error).message}`);
  }
  if (!res.ok) throw new Error(`Device code request failed: ${res.status}`);
  return res.json();
}

export type AccessTokenResponse = { access_token: string; token_type: string; scope: string };

export async function pollAccessToken(
  clientId: string,
  deviceCode: string,
  intervalSec: number,
  timeoutSec: number,
  signal?: AbortSignal
): Promise<AccessTokenResponse> {
  const deadline = Date.now() + timeoutSec * 1000;
  let interval = intervalSec;
  while (Date.now() < deadline) {
    if (signal?.aborted) throw new Error('Cancelled');
    const waitMs = Math.min(interval * 1000, deadline - Date.now());
    if (waitMs <= 0) break;
    await new Promise(r => setTimeout(r, waitMs));
    let res: Response;
    try {
      res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
        signal,
      });
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw new Error('Cancelled');
      throw new Error(`polling network error: ${(e as Error).message}`);
    }
    if (!res.ok) throw new Error(`polling HTTP ${res.status}`);
    let json: any;
    try {
      json = await res.json();
    } catch {
      throw new Error('polling response is not valid JSON');
    }
    if (json.access_token) return json;
    if (json.error === 'authorization_pending') continue;
    if (json.error === 'slow_down') { interval += 5; continue; }
    throw new Error(`OAuth error: ${json.error_description || json.error}`);
  }
  throw new Error('Device flow timed out');
}
