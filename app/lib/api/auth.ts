import { http } from '@/app/lib/http';
import { httpConfig } from '@/app/lib/http/config';
import type { CurrentUser } from '@/app/components/layout/HeaderUserSection';

type LoginResponse = { accessToken?: string };

export async function login(email: string, password: string) {
  const data = await http.post<LoginResponse>(
    httpConfig.authPath,
    { email, password },
    { skipAuth: true },
  );
  if (data?.accessToken) http.storage.set(data.accessToken);
  return data;
}

export async function logout() {
  try {
    await http.post(httpConfig.signOutPath);
  } finally {
    http.storage.clear();
  }
}

export const getCurrentUser = async () => {
  const result = await http.get<{ data: CurrentUser }>(httpConfig.mePath);
  return result.data;
};
