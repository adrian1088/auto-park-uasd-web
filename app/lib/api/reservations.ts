import { http } from "@/app/lib/http";
import type { ApiResponseList } from "@/app/lib/api/base";

export type Reservation = {
  id: number;
  startTime: string;
  endTime: string;
  vehicle: {
    id: number;
    plateNumber: string;
  } | null;
};

const reservationsPath = "/reservations";

export async function getReservations() {
  const response =
    await http.get<ApiResponseList<Reservation>>(reservationsPath);
  return response.data.map((reservation) => ({
    ...reservation,
    id: Number(reservation.id),
  }));
}
