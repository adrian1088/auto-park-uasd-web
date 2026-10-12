export interface TokenStorage {
  /** Si es false el token es httpOnly y el navegador lo envía solo (cookie). */
  readonly exposesToken: boolean;
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

const KEY = 'accessToken';

export const localStorageTokenStorage: TokenStorage = {
  exposesToken: true,
  get: () => (typeof window === 'undefined' ? null : window.localStorage.getItem(KEY)),
  set: (token) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY, token);
  },
  clear: () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
  },
};

export const cookieTokenStorage: TokenStorage = {
  exposesToken: false,
  get: () => null,
  set: () => {},
  clear: () => {},
};
