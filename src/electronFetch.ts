// Electron net.request を使ったミニマル fetch ポリフィル。
// Chromium のネットワークスタックを経由するため、
// 企業プロキシ（MITM）の自己署名証明書も正しく処理される。
export async function electronFetch(input: any, init: any = {}): Promise<any> {
  const { net } = require('electron');
  const url = typeof input === 'string' ? input : input.url;
  const method = init.method || 'GET';

  return new Promise((resolve, reject) => {
    const request = net.request({ method, url });

    const headers = init.headers;
    if (headers) {
      if (headers instanceof Map) {
        for (const [k, v] of headers) request.setHeader(k, String(v));
      } else if (typeof headers.forEach === 'function') {
        headers.forEach((v: any, k: any) => request.setHeader(k, String(v)));
      } else {
        for (const [k, v] of Object.entries(headers)) request.setHeader(k, String(v));
      }
    }

    let status = 0;
    let statusText = '';
    const responseHeaders: Record<string, string> = {};
    const chunks: Buffer[] = [];

    request.on('response', (response: any) => {
      status = response.statusCode;
      statusText = response.statusMessage || '';
      for (const [k, v] of Object.entries(response.headers)) {
        responseHeaders[k.toLowerCase()] = Array.isArray(v)
          ? (v as string[]).join(', ')
          : String(v);
      }
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({
          ok: status >= 200 && status < 300,
          status,
          statusText,
          headers: {
            get: (k: string) => responseHeaders[k.toLowerCase()] ?? null,
            forEach: (cb: (v: string, k: string) => void) => {
              for (const [k, v] of Object.entries(responseHeaders)) cb(v, k);
            },
            has: (k: string) => k.toLowerCase() in responseHeaders,
            entries: () => Object.entries(responseHeaders)[Symbol.iterator](),
            keys: () => Object.keys(responseHeaders)[Symbol.iterator](),
            values: () => Object.values(responseHeaders)[Symbol.iterator](),
            [Symbol.iterator]: () => Object.entries(responseHeaders)[Symbol.iterator](),
          },
          url,
          async json() { return JSON.parse(body.toString('utf8')); },
          async text() { return body.toString('utf8'); },
          async arrayBuffer() {
            return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
          },
          async blob() { throw new Error('blob は未サポート'); },
          clone() { return this; },
        });
      });
      response.on('error', (e: Error) => reject(e));
    });

    request.on('error', (e: Error) => reject(e));

    if (init.body) {
      if (
        typeof init.body === 'string' ||
        Buffer.isBuffer(init.body) ||
        init.body instanceof Uint8Array
      ) {
        request.write(init.body as any);
      } else if (typeof init.body.toString === 'function') {
        request.write(init.body.toString());
      }
    }
    request.end();
  });
}
