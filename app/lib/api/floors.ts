import { http } from "@/app/lib/http";
import type { ApiResponse, ApiResponseList, ApiResponseWithPagination } from "./base";
import type { ParkingLot } from "./lots";

export const floorsPath = "/parking/floors";
export type ParkingFloorStatus = "OPEN" | "FULL";

export type ParkingFloor = {
  id: number;
  floorNumber: number;
  status: ParkingFloorStatus;
  totalSpaceCount: number;
  lot: Pick<ParkingLot, "id" | "name" | "capacity">;
  spaces: Array<{ id: number }>;
};

export type ParkingFloorFields = {
  lotId: number;
  floorNumber: number;
};

export type CreateParkingFloorInput = ParkingFloorFields;
export type UpdateParkingFloorInput = Partial<ParkingFloorFields>;
export type ParkingFloorPaginatedParams = {
  lotId?: number;
  floorNumber?: number;
  page?: number;
  limit?: number;
};

// El API exige lotId para listar pisos sin paginar.
export async function getParkingFloors(lotId: number) {
  const response = await http.get<ApiResponseList<ParkingFloor>>(floorsPath, {
    query: { lotId },
  });
  return response.data;
}

export async function getParkingFloor(id: number) {
  const response = await http.get<ApiResponse<ParkingFloor>>(
    `${floorsPath}/${id}`,
  );
  return response.data;
}

export function getParkingFloorsPaginated(
  query: ParkingFloorPaginatedParams = {},
) {
  return http.get<ApiResponseWithPagination<ParkingFloor>>(
    `${floorsPath}/paginated`,
    { query },
  );
}

export async function createParkingFloor(input: CreateParkingFloorInput) {
  const response = await http.post<ApiResponse<ParkingFloor>>(
    floorsPath,
    input,
  );
  return response.data;
}

export async function updateParkingFloor(
  id: number,
  input: UpdateParkingFloorInput,
) {
  const response = await http.patch<ApiResponse<ParkingFloor>>(
    `${floorsPath}/${id}`,
    input,
  );
  return response.data;
}

export async function deleteParkingFloor(id: number) {
  await http.delete<unknown>(`${floorsPath}/${id}`);
}
