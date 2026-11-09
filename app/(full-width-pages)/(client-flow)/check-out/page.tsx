"use client";

import Descriptions from "@/app/components/Descriptions";
import { HttpError } from "@/app/lib/http/http-client";
import type { PaymentMethod } from "@/app/lib/api/payments";
import { checkOutTicket, getCheckoutQuote, getTicketsPaginated } from "@/app/lib/api/tickets";
import type { CheckoutQuote, Ticket, TicketFilters } from "@/app/lib/api/tickets";
import { formatDateTime, formatMoney } from "@/app/lib/utils/format";
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Select,
  Typography,
} from "antd";
import { useState } from "react";

const { Title, Paragraph, Text } = Typography;
type SearchFields = { code: string };
type CheckoutFields = { paymentMethod: PaymentMethod };

const paymentMethods: Array<{ value: PaymentMethod; label: string }> = [
  { value: "CASH", label: "Efectivo" },
  { value: "CREDIT_CARD", label: "Tarjeta de crédito" },
  { value: "DEBIT_CARD", label: "Tarjeta de débito" },
  { value: "PAYPAL", label: "PayPal" },
];

function getErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    const body = error.body;
    if (body && typeof body === "object" && "message" in body) {
      const message = body.message;
      if (typeof message === "string") return message;
      if (Array.isArray(message)) return message.join(", ");
    }
  }
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

const CheckOutPage = () => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [completedTicket, setCompletedTicket] = useState<Ticket | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchForm] = Form.useForm<SearchFields>();
  const [checkoutForm] = Form.useForm<CheckoutFields>();

  const handleSearch = async ({ code }: SearchFields) => {
    setLoadingQuote(true);
    setError(null);
    setTicket(null);
    setQuote(null);
    setCompletedTicket(null);
    try {
      const filters: TicketFilters = { code: code.trim(), status: "ACTIVE" };
      const response = await getTicketsPaginated({
        ...filters,
        page: 1,
        limit: 1,
      });
      const foundTicket = response.data.find(
        (candidate) => candidate.code === code.trim(),
      );
      if (!foundTicket) {
        setError("No se encontró un ticket activo con ese código.");
        return;
      }

      const checkoutQuote = await getCheckoutQuote(foundTicket.id);
      setTicket(foundTicket);
      setQuote(checkoutQuote);
      checkoutForm.resetFields();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleCheckout = async ({ paymentMethod }: CheckoutFields) => {
    if (!ticket) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await checkOutTicket(ticket.id, paymentMethod);
      setCompletedTicket(result);
      setQuote(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const startAnotherCheckout = () => {
    setTicket(null);
    setQuote(null);
    setCompletedTicket(null);
    setError(null);
    searchForm.resetFields();
    checkoutForm.resetFields();
  };

  const ticketDetails = ticket ?? completedTicket;

  return (
    <Flex
      justify="center"
      align="center"
      style={{ minHeight: "100vh", padding: "32px 16px" }}
    >
      <Card style={{ width: "100%", maxWidth: 680 }}>
        <Flex vertical gap={20}>
          <div>
            <Title level={1} style={{ margin: 0 }}>
              Registrar salida
            </Title>
            <Paragraph style={{ margin: "8px 0 0", fontSize: 16 }}>
              Busca el ticket por su código para consultar el importe y completar
              el pago.
            </Paragraph>
          </div>

          {error && (
            <Alert
              type="error"
              showIcon
              title="No se pudo completar la operación."
              description={error}
            />
          )}

          <Form
            form={searchForm}
            layout="vertical"
            onFinish={(fields) => void handleSearch(fields)}
          >
            <Form.Item
              label="Código del ticket"
              name="code"
              rules={[
                { required: true, message: "Ingresa el código del ticket." },
              ]}
            >
              <Input
                size="large"
                placeholder="Ej.: TCK-2026-..."
                autoComplete="off"
                disabled={loadingQuote || submitting}
              />
            </Form.Item>
            <Button
              block
              size="large"
              type="primary"
              htmlType="submit"
              loading={loadingQuote}
              disabled={submitting}
            >
              Consultar ticket
            </Button>
          </Form>

          {ticketDetails && (
            <Descriptions
              columns={2}
              items={[
                {
                  key: "code",
                  label: "Código",
                  content: ticketDetails.code,
                },
                {
                  key: "status",
                  label: "Estado",
                  content: completedTicket ? "Pagado" : "Activo",
                },
                {
                  key: "entrance",
                  label: "Fecha de entrada",
                  content: formatDateTime(ticketDetails.entranceAt),
                },
                {
                  key: "rate",
                  label: "Tarifa por hora",
                  content: formatMoney(ticketDetails.rateAmount),
                },
              ]}
            />
          )}

          {quote && ticket && (
            <Card size="small" title="Cotización de salida">
              <Flex vertical gap={16}>
                <Descriptions
                  columns={2}
                  items={[
                    {
                      key: "elapsed",
                      label: "Tiempo transcurrido",
                      content: `${quote.elapsedMinutes} min`,
                    },
                    {
                      key: "hours",
                      label: "Horas cobradas",
                      content: quote.chargedHours,
                    },
                    {
                      key: "hourlyRate",
                      label: "Tarifa por hora",
                      content: formatMoney(Number(quote.hourlyRate)),
                    },
                    {
                      key: "amount",
                      label: "Total cotizado",
                      content: <Text strong>{formatMoney(Number(quote.amount))}</Text>,
                    },
                    {
                      key: "quotedAt",
                      label: "Cotizado",
                      content: formatDateTime(quote.quotedAt),
                    },
                  ]}
                />
                <Form
                  form={checkoutForm}
                  layout="vertical"
                  onFinish={(fields) => void handleCheckout(fields)}
                >
                  <Form.Item
                    label="Método de pago"
                    name="paymentMethod"
                    rules={[
                      {
                        required: true,
                        message: "Selecciona un método de pago.",
                      },
                    ]}
                  >
                    <Select
                      size="large"
                      placeholder="Selecciona un método de pago"
                      options={paymentMethods}
                    />
                  </Form.Item>
                  <Button
                    block
                    size="large"
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                  >
                    Confirmar pago y salida
                  </Button>
                </Form>
              </Flex>
            </Card>
          )}

          {completedTicket && (
            <Alert
              type="success"
              showIcon
              title="Check-out registrado correctamente."
              description={
                completedTicket.payment
                  ? `Pago recibido: ${formatMoney(completedTicket.payment.amount)} (${paymentMethods.find((method) => method.value === completedTicket.payment?.paymentMethod)?.label ?? completedTicket.payment.paymentMethod}). Salida: ${formatDateTime(completedTicket.exitAt)}.`
                  : `Salida registrada: ${formatDateTime(completedTicket.exitAt)}.`
              }
              action={
                <Button size="small" onClick={startAnotherCheckout}>
                  Buscar otro ticket
                </Button>
              }
            />
          )}
        </Flex>
      </Card>
    </Flex>
  );
};

export default CheckOutPage;
