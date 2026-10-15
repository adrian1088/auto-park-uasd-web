import { http } from "@/app/lib/http";
import type { ApiResponse, ApiResponseList } from "./base";
import type { ParkingLot } from "./lots";

export type ParkingFloorStatus = "OPEN" | "FULL";

export type ParkingFloor = {
  id: number;
  floorNumber: number;
  status: ParkingFloorStatus;
  parkingLot: Pick<ParkingLot, "id" | "name">;
  spaces: Array<{ id: number }>;
};

export type ParkingFloorFields = {
  parkingLotId: number;
  floorNumber: number;
};

export type CreateParkingFloorInput = ParkingFloorFields;
export type UpdateParkingFloorInput = Partial<ParkingFloorFields>;

const floorsPath = "/parking/floors";

export async function getParkingFloors(parkingLotId?: number) {
  const response = await http.get<ApiResponseList<ParkingFloor>>(floorsPath, {
    query: { parkingLotId },
  });
  return response.data;
}

export async function getParkingFloor(id: number) {
  const response = await http.get<ApiResponse<ParkingFloor>>(
    `${floorsPath}/${id}`,
  );
  return response.data;
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
