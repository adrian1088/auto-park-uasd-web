import { http } from "@/app/lib/http";
import type {
  ApiParamsPagination,
  ApiResponse,
  ApiResponseWithPagination,
} from "@/app/lib/api/base";
import type { PaymentMethod } from "@/app/lib/api/payments";

export type TicketStatus = "ACTIVE" | "PAID" | "CANCELLED" | "COMPLETED";

export type Ticket = {
  id: number;
  code: string;
  entranceAt: string;
  exitAt: string | null;
  status: TicketStatus;
  rateAmount: number;
  vehicle?: {
    id: number;
    plateNumber: string;
    type: string;
  };
  spot?: {
    id: number;
    spaceNumber: string;
    floor?: { floorNumber: number };
  };
  payment?: {
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
  } | null;
};

export type CheckInInput =
  | { vehicleId: number; userId: number; parkingLotId: number }
  | { reservationId: number };

export type CheckoutQuote = {
  ticketId: number;
  entranceAt: string;
  quotedAt: string;
  elapsedMinutes: number;
  chargedHours: number;
  hourlyRate: string;
  amount: string;
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
  return normalizeTicket(response.data);
}

export async function checkInTicket(input: CheckInInput) {
  const response = await http.post<ApiResponse<Ticket>>(
    `${ticketsPath}/check-in`,
    input,
  );
  return normalizeTicket(response.data);
}

export async function getCheckoutQuote(ticketId: number) {
  const response = await http.get<ApiResponse<CheckoutQuote>>(
    `${ticketsPath}/${ticketId}/checkout-quote`,
  );
  return response.data;
}

export async function checkOutTicket(
  ticketId: number,
  paymentMethod: PaymentMethod,
) {
  const response = await http.post<ApiResponse<Ticket>>(
    `${ticketsPath}/${ticketId}/check-out`,
    { paymentMethod },
  );
  return normalizeTicket(response.data);
}

function normalizeTicket(ticket: Ticket): Ticket {
  return {
    ...ticket,
    id: Number(ticket.id),
    rateAmount: Number(ticket.rateAmount),
    payment: ticket.payment
      ? { ...ticket.payment, amount: Number(ticket.payment.amount) }
      : ticket.payment,
  };
}
