import { http } from "@/app/lib/http";
import type { ApiResponseList } from "@/app/lib/api/base";

export type Vehicle = {
  id: number;
  plateNumber: string;
  make: string;
  model: string;
  type: string;
  user: { id: number } | null;
};

const vehiclesPath = "/vehicles";

export async function getVehicles() {
  const response = await http.get<ApiResponseList<Vehicle>>(vehiclesPath);
  return response.data.map((vehicle) => ({
    ...vehicle,
    id: Number(vehicle.id),
  }));
}
