import { httpConfig } from './config';
import { createHttpClient } from './http-client';
import { cookieTokenStorage, localStorageTokenStorage } from './token-storage';
let isRedirecting = false; 

// Para cuando recarguemos la página (Ctrl + R) o cambias de pestaña rápidamente, la aplicación web no realice
// varias peticiones al servidor al mismo tiempo en segundo plano y parecia un caos
  export const http = createHttpClient({
  baseUrl: httpConfig.baseUrl,
  refreshPath: httpConfig.refreshPath,
  storage: httpConfig.tokenStorage === 'cookie' ? cookieTokenStorage : localStorageTokenStorage,
  authPath: httpConfig.authPath,
  onAuthFailure: () => {
    if (typeof window !== 'undefined' && window.location.pathname !== httpConfig.loginPath) {
      if (!isRedirecting) {
        isRedirecting = true;
        // Damos un pequeño respiro para que las peticiones concurrentes terminen
        setTimeout(() => {
          window.location.assign(httpConfig.loginPath);
        }, 500);
      }
    }
  },
});

export { createHttpClient, HttpError } from './http-client';
export type { HttpClient, RequestOptions } from './http-client';
export * from './token-storage';
