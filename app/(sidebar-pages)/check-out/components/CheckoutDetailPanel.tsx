"use client";

import React from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Flex,
  Result,
  Select,
  Space,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import type { CheckoutQuote, Ticket } from "@/app/lib/api/tickets";
import type { PaymentMethod } from "@/app/lib/api/payments";
import { formatDateTime, formatMoney } from "@/app/lib/utils/format";

const { Text, Title } = Typography;

const PAYMENT_METHOD_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: "Efectivo", value: "CASH" as PaymentMethod },
  { label: "Tarjeta de Crédito", value: "CREDIT_CARD" as PaymentMethod },
  { label: "Tarjeta de Débito", value: "DEBIT_CARD" as PaymentMethod },
  { label: "PayPal", value: "PAYPAL" as PaymentMethod },
];

interface CheckoutDetailPanelProps {
  selectedTicket: Ticket | null;
  completedTicket: Ticket | null;
  quote: CheckoutQuote | null;
  loadingQuote: boolean;
  quoteError: string | null;
  paymentMethod: PaymentMethod;
  submitting: boolean;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onConfirmCheckOut: () => void;
  onCancel: () => void;
  onResetCompleted: () => void;
  getPlate: (ticket: Ticket) => string;
  getSpace: (ticket: Ticket) => string;
}

export function CheckoutDetailPanel({
  selectedTicket,
  completedTicket,
  quote,
  loadingQuote,
  quoteError,
  paymentMethod,
  submitting,
  onPaymentMethodChange,
  onConfirmCheckOut,
  onCancel,
  onResetCompleted,
  getPlate,
  getSpace,
}: CheckoutDetailPanelProps) {
  return (
    <Card
      style={{
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
      title={
        <Space>
          <DollarOutlined />
          <span>Detalle de Salida y Cobro</span>
        </Space>
      }
    >
      {completedTicket && !selectedTicket && (
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: "#16a34a" }} />}
          title="Check-Out Completado"
          subTitle={`Salida registrada: ${
            completedTicket.exitAt
              ? formatDateTime(completedTicket.exitAt)
              : "Ahora"
          }`}
          extra={[
            <Button
              key="new-checkout"
              type="primary"
              onClick={onResetCompleted}
            >
              Procesar otro ticket
            </Button>,
          ]}
        />
      )}

      {!completedTicket && !selectedTicket && (
        <Flex
          vertical
          align="center"
          justify="center"
          gap={8}
          style={{ padding: "48px 16px" }}
        >
          <ClockCircleOutlined style={{ fontSize: 32, color: "#64748b" }} />
          <Text type="secondary">
            Selecciona un ticket activo de la lista para calcular el tiempo y
            monto a cobrar.
          </Text>
        </Flex>
      )}

      {selectedTicket && (
        <Flex vertical gap={16}>
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2 }}
            items={[
              {
                key: "plate",
                label: "Matrícula",
                children: <Text strong>{getPlate(selectedTicket)}</Text>,
              },
              {
                key: "space",
                label: "Espacio",
                children: getSpace(selectedTicket),
              },
              {
                key: "entrance",
                label: "Hora de Entrada",
                children: formatDateTime(selectedTicket.entranceAt),
              },
            ]}
          />

          {quoteError && (
            <Alert
              type="error"
              showIcon
              title="No se pudo calcular la cotización"
              description={quoteError}
            />
          )}

          {quote && (
            <Card
              size="small"
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
            >
              <Flex vertical gap={8}>
                <Flex justify="space-between">
                  <Text type="secondary">Tiempo transcurrido:</Text>
                  <Text strong>{quote.elapsedMinutes} min</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text type="secondary">Horas cobrables:</Text>
                  <Text strong>{quote.chargedHours} h</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text type="secondary">Tarifa por hora:</Text>
                  <Text strong>{formatMoney(Number(quote.hourlyRate))}</Text>
                </Flex>
                <Divider style={{ margin: "6px 0" }} />
                <Flex justify="space-between" align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Total a Pagar
                  </Title>
                  <Title level={4} style={{ margin: 0, color: "#16a34a" }}>
                    {formatMoney(Number(quote.amount))}
                  </Title>
                </Flex>
              </Flex>
            </Card>
          )}

          <Flex vertical gap={8}>
            <Text strong>Método de Pago</Text>
            <Select
              size="large"
              value={paymentMethod}
              options={PAYMENT_METHOD_OPTIONS}
              onChange={(val) => onPaymentMethodChange(val)}
              disabled={submitting || !quote}
            />
          </Flex>

          <Flex justify="end" gap={10}>
            <Button onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<LogoutOutlined />}
              loading={submitting || loadingQuote}
              disabled={!quote || Boolean(quoteError)}
              onClick={onConfirmCheckOut}
            >
              Confirmar Check-Out y Cobrar
            </Button>
          </Flex>
        </Flex>
      )}
    </Card>
  );
}