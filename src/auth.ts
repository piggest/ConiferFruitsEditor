import keytar from 'keytar';

export const SERVICE = 'DocMDTest-desktop';
export const ACCOUNT = 'github-token';

// HTTP クライアント抽象層。本番は Electron net (Chromium スタック — プロキシ/証明書を自動処理)、
// テスト時はモックを注入可能。
export type HttpClient = (url: string, init: {
  method: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}) => Promise<{ ok: boolean; status: number; json(): Promise<any> }>;

function defaultFetchClient(url: string, init: {
  method: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}): Promise<{ ok: boolean; status: number; json(): Promise<any> }> {
  // Lazy-require: Vitest 環境 (Electron なし) でもテスト可能にするため遅延読み込み
  const { net } = require('electron');
  return new Promise((resolve, reject) => {
    if (init.signal?.aborted) {
      reject(new Error('AbortError'));
      return;
    }
    const request = net.request({ method: init.method, url });
    if (init.headers) {
      for (const [k, v] of Object.entries(init.headers)) {
        request.setHeader(k, v as string);
      }
    }
    let status = 0;
    const chunks: Buffer[] = [];
    request.on('response', (response: any) => {
      status = response.statusCode;
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({
          ok: status >= 200 && status < 300,
          status,
          async json() { return JSON.parse(text); },
        });
      });
      response.on('error', (e: Error) => reject(e));
    });
    request.on('error', (e: Error) => reject(e));
    if (init.body) request.write(init.body);
    request.end();

    // AbortSignal 対応
    if (init.signal) {
      init.signal.addEventListener('abort', () => {
        const err = new Error('AbortError');
        err.name = 'AbortError';
        reject(err);
      });
    }
  });
}

let httpClient: HttpClient = defaultFetchClient;

export function setHttpClient(client: HttpClient): void { httpClient = client; }
export function resetHttpClient(): void { httpClient = defaultFetchClient; }

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
  let res: { ok: boolean; status: number; json(): Promise<any> };
  try {
    res = await httpClient('https://github.com/login/device/code', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, scope: 'repo' }).toString(),
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
    let res: { ok: boolean; status: number; json(): Promise<any> };
    try {
      res = await httpClient('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }).toString(),
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
