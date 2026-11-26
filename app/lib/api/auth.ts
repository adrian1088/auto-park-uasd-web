import { http } from "@/app/lib/http";
import { httpConfig } from "@/app/lib/http/config";
import type { CurrentUser } from "@/app/components/layout/HeaderUserSection";

type LoginResponse = { accessToken?: string };

export type SignUpFields = {
  name: string;
  email: string;
  phone: number;
  password: string;
};

export type ActivateEmailFields = {
  token: string;
  password?: string;
};

export const login = async (email: string, password: string) => {
  const data = await http.post<LoginResponse>(
    httpConfig.authPath,
    { email, password },
    { skipAuth: true },
  );
  if (data?.accessToken) http.storage.set(data.accessToken);
  return data;
};

export const logout = async () => {
  try {
    await http.post(httpConfig.logoutPath);
  } finally {
    http.storage.clear();
  }
};

export const getCurrentUser = async () => {
  const result = await http.get<{ data: CurrentUser }>(httpConfig.mePath);
  return result.data;
};

export const register = async ({ name, email, phone, password }: SignUpFields) => {
  const data = await http.post<LoginResponse>(
    httpConfig.registerPath,
    { name, email, phone, password },
    { skipAuth: true },
  );
  return data;
};

export const activateEmail = async ({ token, password }: ActivateEmailFields) => {
  const data = await http.post(
    httpConfig.activatePath,
    { token, password },
    { skipAuth: true },
  );
  return data;
};

export const forgotPassword = async (email: string) => {
  const data = await http.post(
    httpConfig.forgotPasswordPath,
    { email },
    { skipAuth: true },
  );
  return data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const data = await http.post(
    httpConfig.resetPasswordPath,
    { token, newPassword },
    { skipAuth: true },
  );
  return data;
};
