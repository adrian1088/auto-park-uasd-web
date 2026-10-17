import { http } from "@/app/lib/http";
import type { ApiResponse, ApiResponseList, ApiResponseWithPagination } from "./base";
import type { ParkingFloor } from "./floors";

export const spacesPath = "/parking/spaces";
export const PARKING_SPACE_TYPES = [
  "CAR",
  "TRUCK",
  "MOTORCYCLE",
  "VAN",
  "BUS",
  "SUV",
  "PICKUP",
] as const;

export type ParkingSpaceType = (typeof PARKING_SPACE_TYPES)[number];

export type ParkingSpaceStatus =
  | "FREE"
  | "OCCUPIED"
  | "RESERVED"
  | "OUT_OF_SERVICE";

export type ParkingSpace = {
  id: number;
  spaceNumber: string;
  type: ParkingSpaceType;
  status: ParkingSpaceStatus;
  floor: Pick<ParkingFloor, "id" | "floorNumber" | "lot">;
};

export type ParkingSpaceFields = {
  spaceNumber: string;
  type: ParkingSpaceType;
  floorId: number;
};

export type ParkingSpacesPaginatedParams = {
  lotId?: number;
  floorId?: number;
  page?: number;
  limit?: number;
};
export type CreateParkingSpaceInput = ParkingSpaceFields;
export type UpdateParkingSpaceInput = Partial<ParkingSpaceFields> & {
  status?: ParkingSpaceStatus;
};


export async function getParkingSpaces(lotId?: number, floorId?: number) {
  const response = await http.get<ApiResponseList<ParkingSpace>>(spacesPath, {
    query: { lotId, floorId },
  });
  return response.data;
}

export async function getParkingSpace(id: number) {
  const response = await http.get<ApiResponse<ParkingSpace>>(
    `${spacesPath}/${id}`,
  );
  return response.data;
}

export function getParkingSpacesPaginated(
  input: ParkingSpacesPaginatedParams = {},
) {
  return http.get<ApiResponseWithPagination<ParkingSpace>>(
    `${spacesPath}/paginated`,
    { query: input },
  );
}

export async function createParkingSpace(input: CreateParkingSpaceInput) {
  const response = await http.post<ApiResponse<ParkingSpace>>(
    spacesPath,
    input,
  );
  return response.data;
}

export async function updateParkingSpace(
  id: number,
  input: UpdateParkingSpaceInput,
) {
  const response = await http.patch<ApiResponse<ParkingSpace>>(
    `${spacesPath}/${id}`,
    input,
  );
  return response.data;
}

export async function deleteParkingSpace(id: number) {
  await http.delete<unknown>(`${spacesPath}/${id}`);
}
