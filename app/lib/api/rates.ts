import { http } from "@/app/lib/http";

export type RateType = "HOURLY" | "DAILY" | "MONTHLY";

export type Rate = {
  id: number;
  parkingLot: { id: number, name: string };
  type: RateType;
  amount: number;
  validFrom: string;
  validTo?: string | null;
};

// El API devuelve el estacionamiento anidado y los bigint/decimal como string.
function normalizeRate(rate: Rate): Rate {
  return {
    ...rate,
    id: Number(rate.id),
    parkingLot: rate.parkingLot,
    amount: Number(rate.amount),
  };
}

export type RateFields = {
  parkingLotId: number;
  type: RateType;
  amount: number;
  validFrom: string;
  validTo?: string;
};

export type CreateRateInput = RateFields;

export type UpdateRateInput = Partial<RateFields>;

export type RateListParams = {
  parkingLotId?: number;
  type?: RateType;
};

type RateListPaginatedParams = RateListParams & { page: number; limit: number };

type RateResponse = { data: Rate };

const ratesPath = "/rates";

export async function getRates(params: RateListParams) {
  const response = await http.get<Rate[] | { data: Rate[] }>(ratesPath, {
    query: params,
  });
  const rates = Array.isArray(response) ? response : (response?.data ?? []);
  return rates;
}

export async function getPaginatedRates(params: RateListPaginatedParams) {
  const response = await http.get<{ data: Rate[]; total: number }>(ratesPath + '/paginated', {
    query: params,
  });
  const { data, total } = response ?? { data: [], total: 0 };
  return { data, total };
}

export async function getRate(id: number) {
  const response = await http.get<RateResponse>(`${ratesPath}/${id}`);
  return response.data;
}

export async function createRate(input: CreateRateInput) {
  const response = await http.post<RateResponse>(ratesPath, input);
  return response.data;
}

export async function updateRate(id: number, input: UpdateRateInput) {
  await http.patch<unknown>(`${ratesPath}/${id}`, input);
}

export async function deleteRate(id: number) {
  await http.delete<unknown>(`${ratesPath}/${id}`);
}

