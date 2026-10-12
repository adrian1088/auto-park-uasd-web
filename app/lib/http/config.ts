export type TokenStorageMode = 'localStorage' | 'cookie';

export const httpConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1",
  tokenStorage: (process.env.NEXT_PUBLIC_TOKEN_STORAGE === "cookie"
    ? "cookie"
    : "localStorage") as TokenStorageMode,
  refreshPath: process.env.NEXT_PUBLIC_REFRESH_PATH ?? "/auth/refresh",
  authPath: (process.env.NEXT_PUBLIC_AUTH_PATH ?? '/auth/sign-in').trim(),
  signInPath: '/sign-in',
  mePath: (process.env.NEXT_PUBLIC_ME_PATH ?? '/auth/me').trim(),
  signOutPath: (process.env.NEXT_PUBLIC_SIGN_OUT_PATH ?? '/auth/sign-out').trim(),
};
