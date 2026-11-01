export type TokenStorageMode = "localStorage" | "cookie";

export const httpConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1",
  tokenStorage: (process.env.NEXT_PUBLIC_TOKEN_STORAGE === "cookie"
    ? "cookie"
    : "localStorage") as TokenStorageMode,
  refreshPath: (process.env.NEXT_PUBLIC_REFRESH_PATH ?? "/auth/refresh").trim(),
  authPath: (process.env.NEXT_PUBLIC_LOGIN_PATH ?? "/auth/login").trim(),
  loginPath: "/sign-in",
  mePath: (process.env.NEXT_PUBLIC_ME_PATH ?? "/auth/me").trim(),
  logoutPath: (process.env.NEXT_PUBLIC_LOGOUT_PATH ?? "/auth/logout").trim(),
  registerPath: (
    process.env.NEXT_PUBLIC_REGISTER_PATH ?? "/auth/register"
  ).trim(),
  activatePath: (
    process.env.NEXT_PUBLIC_ACTIVATE_EMAIL_PATH ?? "/auth/activate"
  ).trim(),
  forgotPasswordPath: (process.env.NEXT_PUBLIC_FORGOT_PASSWORD_PATH ?? "/auth/forgot-password").trim(),
  resetPasswordPath: (process.env.NEXT_PUBLIC_RESET_PASSWORD_PATH ?? "/auth/reset-password").trim()
};
