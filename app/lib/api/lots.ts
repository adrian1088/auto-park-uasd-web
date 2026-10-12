import { http } from "@/app/lib/http";
import {
  ApiResponseWithPagination,
  ApiResponseList,
  ApiResponse,
} from "./base";

export type ParkingLot = {
  id: number;
  name: string;
  location: string;
  floors: number;
  //   rates: Array<{
  //     id: number;
  //     name: string;
  //     price: number;
  //   }>;
  //   spaces: Array<{
  //     id: number;
  //     number: string;
  //     floor: number;
  //   }>;
};

export type ParkingLotPaginatedParams = {
  page?: number;
  limit?: number;
};

// type ParkingLotPaginatedResponse = {
//     data: ParkingLot[];
//     meta: Meta;
// };

const lotsPath = "/parking/lots";

export async function getParkingLots() {
  const response = await http.get<ApiResponseList<ParkingLot>>(lotsPath);
  return response.data;
}

export async function getParkingLot(id: number) {
  const response = await http.get<ApiResponse<ParkingLot>>(`${lotsPath}/${id}`);
  return response.data;
}

export function getParkingLotsPaginated(input: ParkingLotPaginatedParams) {
  return http.get<ApiResponseWithPagination<ParkingLot>>(lotsPath, {
    query: input,
  });
}
