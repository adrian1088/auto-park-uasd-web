import { http } from "@/app/lib/http";
import type {
  ApiParamsPagination,
  ApiResponse,
  ApiResponseWithPagination,
} from "@/app/lib/api/base";
import type { Ticket } from "@/app/lib/api/tickets";

export type PaymentMethod = "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "PAYPAL";

export type Payment = {
  id: number;
  amount: number;
  date: string;
  method: PaymentMethod;
  ticket: Ticket;
};

export type PaymentFields = {
  ticketId: number;
  amount: number;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
};

export type PaymentFilters = {
  ticketId?: number;
  method?: PaymentMethod;
};

const paymentsPath = "/payments";

export function getPaymentsPaginated(
  params: ApiParamsPagination & PaymentFilters = {},
) {
  return http.get<ApiResponseWithPagination<Payment>>(
    `${paymentsPath}/paginated`,
    { query: params },
  );
}

export async function getPayment(id: number) {
  const response = await http.get<ApiResponse<Payment>>(
    `${paymentsPath}/${id}`,
  );
  return response.data;
}

export async function createPayment(input: PaymentFields) {
  const response = await http.post<ApiResponse<Payment>>(paymentsPath, input);
  return response.data;
}

export async function updatePayment(id: number, input: Partial<PaymentFields>) {
  await http.patch<ApiResponse<Payment>>(`${paymentsPath}/${id}`, input);
}

export async function deletePayment(id: number) {
  await http.delete(`${paymentsPath}/${id}`);
}
