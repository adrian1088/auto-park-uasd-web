import { httpConfig } from './config';
import { createHttpClient } from './http-client';
import { cookieTokenStorage, localStorageTokenStorage } from './token-storage';

export const http = createHttpClient({
  baseUrl: httpConfig.baseUrl,
  refreshPath: httpConfig.refreshPath,
  storage: httpConfig.tokenStorage === 'cookie' ? cookieTokenStorage : localStorageTokenStorage,
  authPath: httpConfig.authPath,
  onAuthFailure: () => {
    if (typeof window !== 'undefined' && window.location.pathname !== httpConfig.signInPath) {
      window.location.assign(httpConfig.signInPath);
    }
  },
});

export { createHttpClient, HttpError } from './http-client';
export type { HttpClient, RequestOptions } from './http-client';
export * from './token-storage';
