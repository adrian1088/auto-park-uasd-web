import type { TokenStorage } from './token-storage';

export class HttpError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message?: string,
  ) {
    super(message ?? `HTTP ${status}`);
    this.name = 'HttpError';
  }
}

export type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** No adjunta token ni intenta refresh (login, refresh). */
  skipAuth?: boolean;
};

export type HttpClientConfig = {
  baseUrl: string;
  storage: TokenStorage;
  refreshPath: string;
  authPath: string;
  onAuthFailure?: () => void;
};

export function createHttpClient(config: HttpClientConfig) {
  const { baseUrl, storage, refreshPath, onAuthFailure } = config;
  let refreshing: Promise<boolean> | null = null;

  const buildUrl = (path: string, query?: RequestOptions['query']) => {
    const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const url = new URL(baseUrl.replace(/\/+$/, '') + path.replace(/^\/?/, '/'), origin);
    Object.entries(query ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
    return url.toString();
  };

  const send = (method: string, path: string, opts: RequestOptions) => {
    const { query, body, skipAuth, headers: h, ...rest } = opts;
    const headers = new Headers(h);
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    
    if (body !== undefined && !isForm && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const token = skipAuth ? null : storage.get();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(buildUrl(path, query), {
      ...rest,
      method,
      headers,
      credentials: 'include',
      body:
        body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  };

  // Una sola petición de refresh compartida entre requests concurrentes.
  const refresh = (): Promise<boolean> => {
    refreshing ??= (async () => {
      try {
        const res = await send('POST', refreshPath, { skipAuth: true });
        if (!res.ok) return false;
        const data = (await res.json().catch(() => null)) as { accessToken?: string } | null;
        if (storage.exposesToken) {
          if (!data?.accessToken) return false;
          storage.set(data.accessToken);
        }
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
    return refreshing;
  };

  async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    let res = await send(method, path, opts);
    if (res.status === 401 && !opts.skipAuth) {
      if (await refresh()) {
        res = await send(method, path, opts);
      } else {
        storage.clear();
        onAuthFailure?.();
      }
    }
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    if (!res.ok) throw new HttpError(res.status, data);
    return data as T;
  }

  return {
    request,
    get: <T>(p: string, o?: RequestOptions) => request<T>('GET', p, o),
    post: <T>(p: string, body?: unknown, o?: RequestOptions) => request<T>('POST', p, { ...o, body }),
    put: <T>(p: string, body?: unknown, o?: RequestOptions) => request<T>('PUT', p, { ...o, body }),
    patch: <T>(p: string, body?: unknown, o?: RequestOptions) => request<T>('PATCH', p, { ...o, body }),
    delete: <T>(p: string, o?: RequestOptions) => request<T>('DELETE', p, o),
    storage,
  };
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export type HttpClient = ReturnType<typeof createHttpClient>;
