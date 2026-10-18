import { http } from "@/app/lib/http";
import type {
  ApiParamsPagination,
  ApiResponse,
  ApiResponseWithPagination,
} from "@/app/lib/api/base";

export type TicketStatus = "ACTIVE" | "PAID" | "CANCELLED" | "COMPLETED";

export type Ticket = {
  id: number;
  code: string;
  entranceAt: string;
  exitAt: string | null;
  status: TicketStatus;
  rateAmount: number;
};

export type TicketFilters = {
  code?: string;
  status?: TicketStatus;
  fromDate?: string;
  toDate?: string;
};

const ticketsPath = "/tickets";

export function getTicketsPaginated(
  params: ApiParamsPagination & TicketFilters = {},
) {
  return http.get<ApiResponseWithPagination<Ticket>>(
    `${ticketsPath}/paginated`,
    { query: params },
  );
}

export async function getTicket(id: number) {
  const response = await http.get<ApiResponse<Ticket>>(`${ticketsPath}/${id}`);
  return response.data;
}
