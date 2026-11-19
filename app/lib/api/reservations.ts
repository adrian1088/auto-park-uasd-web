import type {
  ApiParamsPagination,
  ApiResponse,
  ApiResponseWithPagination,
} from "@/app/lib/api/base";
import { http } from "@/app/lib/http";

export type Reservation = {
  startTime: string;
  endTime: string;
  parkingSpaceId: number;
  vehiclePlateNumber?: string | null;
};

export type ReservationFields = {
  startTime: string;
  endTime: string;
  parkingSpaceId: number;
  vehiclePlateNumber?: string | null;
};

export type CreateReservationInput = ReservationFields;
export type UpdateReservationInput = Partial<ReservationFields>;

const reservationsPath = "/reservations";

export function getReservationsPaginated(
  params: ApiParamsPagination = {},
) {
  return http.get<ApiResponseWithPagination<Reservation>>(
    `${reservationsPath}/paginated`,
    { query: params },
  );
}

export async function getReservation(id: number) {
  const response = await http.get<ApiResponse<Reservation>>(
    `${reservationsPath}/${id}`,
  );
  return response.data;
}

export async function createReservation(input: CreateReservationInput) {
  const response = await http.post<ApiResponse<Reservation>>(
    reservationsPath,
    input,
  );
  return response.data;
}

export async function updateReservation(
  id: number,
  input: UpdateReservationInput,
) {
  const response = await http.patch<ApiResponse<Reservation>>(
    `${reservationsPath}/${id}`,
    input,
  );
  return response.data;
}

export async function deleteReservation(id: number) {
  await http.delete<unknown>(`${reservationsPath}/${id}`);
}
