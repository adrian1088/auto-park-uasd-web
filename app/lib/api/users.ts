import { http } from "@/app/lib/http";
import type { ApiResponseWithPagination, ApiResponse, ApiParamsPagination } from "@/app/lib/api/base";

export type User = {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
};

export type UserFields = Pick<
  User,
  "name" | "email" | "phone" | "role" | "status"
>;

export type CreateUserInput = UserFields;

export type UpdateUserInput = Partial<UserFields>;

const usersPath = "/users";

export function getUsersPaginated(params: ApiParamsPagination = {}) {
  return http.get<ApiResponseWithPagination<User>>(usersPath, {
    query: params,
  });
}

export async function getUser(id: number) {
  const response = await http.get<ApiResponse<User>>(`${usersPath}/${id}`);
  return response.data;
}

export async function createUser(input: CreateUserInput) {
  const response = await http.post<ApiResponse<User>>(usersPath, input);
  return response.data;
}

export async function updateUser(id: number, input: UpdateUserInput) {
  await http.patch<ApiResponse<User>>(`${usersPath}/${id}`, input);
}

export async function deleteUser(id: number) {
  await http.delete<ApiResponse<User>>(`${usersPath}/${id}`);
}
