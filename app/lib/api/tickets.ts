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
  vehiclePlateNumber?: string;
  plateNumber?: string;
  parkingSpaceId?: number | null;
  spaceNumber?: string | null;
  spotNumber?: string;
  entranceAt: string;
  exitAt: string | null;
  status: TicketStatus;
  rateAmount: number;
  rate_amount?: number | string;
  rate?: { amount?: number | string };
  reservation?: {
    id?: number;
    vehiclePlateNumber?: string | null;
    parkingSpace?: { spaceNumber?: string } | null;
  } | null;
  vehicle?: {
    id: number;
    plateNumber: string;
    type: string;
  };
  spot?: {
    id: number;
    spaceNumber: string;
    floorNumber?: number;
    floor?: { floorNumber: number };
  } | null;
  payment?: {
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
  } | null;
};

export type CheckInInput =
  | { plateNumber: string; parkingLotId: number }
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
  const response = await http.get<ApiResponse<Ticket> | Ticket>(
    `${ticketsPath}/${id}`,
  );
  return normalizeTicket(unwrapData(response));
}

export async function checkInTicket(input: CheckInInput) {
  const response = await http.post<ApiResponse<Ticket> | Ticket>(
    `${ticketsPath}/check-in`,
    input,
  );
  return normalizeTicket(unwrapData(response));
}

export async function getCheckoutQuote(ticketId: number) {
  const response = await http.get<ApiResponse<CheckoutQuote> | CheckoutQuote>(
    `${ticketsPath}/${ticketId}/checkout-quote`,
  );
  return unwrapData(response);
}

export async function checkOutTicket(
  ticketId: number,
  paymentMethod: PaymentMethod,
) {
  const response = await http.post<ApiResponse<Ticket> | Ticket>(
    `${ticketsPath}/${ticketId}/check-out`,
    { paymentMethod },
  );
  return normalizeTicket(unwrapData(response));
}

function unwrapData<T>(payload: ApiResponse<T> | T): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as ApiResponse<T>).data !== undefined
  ) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

function normalizeTicket(rawTicket: Ticket): Ticket {
  const ticket = rawTicket ?? ({} as Ticket);
  const rawRate =
    ticket.rateAmount ?? ticket.rate_amount ?? ticket.rate?.amount ?? 0;
  const parsedRate = Number(rawRate);

  const resolvedPlate =
    ticket.vehiclePlateNumber ??
    ticket.plateNumber ??
    ticket.vehicle?.plateNumber ??
    ticket.reservation?.vehiclePlateNumber ??
    "";

  const resolvedSpace =
    ticket.spaceNumber ??
    ticket.spot?.spaceNumber ??
    ticket.spotNumber ??
    ticket.reservation?.parkingSpace?.spaceNumber ??
    null;

  return {
    ...ticket,
    id: Number(ticket.id),
    rateAmount: Number.isFinite(parsedRate) ? parsedRate : 0,
    vehiclePlateNumber: String(resolvedPlate).trim().toUpperCase(),
    spaceNumber: resolvedSpace,
    payment: ticket.payment
      ? { ...ticket.payment, amount: Number(ticket.payment.amount) }
      : ticket.payment,
  };
}
