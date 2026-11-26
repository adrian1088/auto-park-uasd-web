import type {
  ApiParamsPagination,
  ApiResponse,
  ApiResponseWithPagination,
} from "@/app/lib/api/base";
import { http } from "@/app/lib/http";

export type Reservation = {
  id?: number;
  status?: string | null;
  hasTicket?: boolean;
  has_ticket?: boolean;
  ticketId?: number | string | null;
  ticket_id?: number | string | null;
  qrCode?: string | null;
  startTime: string;
  endTime: string;
  parkingSpaceId: number;
  parkingLotId?: number;
  vehiclePlateNumber?: string | null;
  parkingSpace?: {
    id?: number;
    spaceNumber?: string | number;
    floor?: {
      floorNumber?: string | number;
      lot?: {
        id?: number;
        name?: string;
      } | null;
    } | null;
  } | null;
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

export async function deleteReservation(id: number | string) {
  await http.delete<unknown>(`${reservationsPath}/${id}`);
}

export async function validateReservationQr(code: string) {
  const response = await http.post<ApiResponse<Reservation> & Reservation>(
    `${reservationsPath}/validate-qr`,
    { code },
  );
  const data = (response && typeof response === "object" && "data" in response && response.data
    ? response.data
    : response) as Reservation;
  return data;
}