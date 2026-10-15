import { http } from "@/app/lib/http";
import {
  ApiResponseWithPagination,
  ApiResponseList,
  ApiResponse,
} from "./base";

export type ParkingLot = {
  id: number;
  name: string;
  address: string;
  capacity: number;
};

export type ParkingLotFields = Pick<
  ParkingLot,
  "name" | "address" | "capacity"
>;

export type ParkingLotPaginatedParams = {
  page?: number;
  limit?: number;
};

export type CreateParkingLotInput = ParkingLotFields;
export type UpdateParkingLotInput = Partial<ParkingLotFields>;

const lotsPath = "/parking/lots";

export async function getParkingLots() {
  const response = await http.get<ApiResponseList<ParkingLot>>(lotsPath);
  return response.data;
}

export async function getParkingLot(id: number) {
  const response = await http.get<ApiResponse<ParkingLot>>(`${lotsPath}/${id}`);
  return response.data;
}

export function getParkingLotsPaginated(input: ParkingLotPaginatedParams = {}) {
  return http.get<ApiResponseWithPagination<ParkingLot>>(`${lotsPath}/paginated`, {
    query: input,
  });
}

export async function createParkingLot(input: CreateParkingLotInput) {
  const response = await http.post<ApiResponse<ParkingLot>>(lotsPath, input);
  return response.data;
}

export async function updateParkingLot(
  id: number,
  input: UpdateParkingLotInput,
) {
  const response = await http.patch<ApiResponse<ParkingLot>>(
    `${lotsPath}/${id}`,
    input,
  );
  return response.data;
}

export async function deleteParkingLot(id: number) {
  await http.delete<unknown>(`${lotsPath}/${id}`);
}
