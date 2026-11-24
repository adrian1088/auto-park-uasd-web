"use client";

import React from "react";
import { Card, Col, List, Row, Space, Tag, Typography } from "antd";
import {
  CarOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import type { Ticket, TicketStatus } from "@/app/lib/api/tickets";
import type { Payment, PaymentMethod } from "@/app/lib/api/payments";
import { formatDateTime, formatMoney } from "@/app/lib/utils/format";

const { Text } = Typography;

const METHOD_TEXT: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CREDIT_CARD: "Tarjeta de Crédito",
  DEBIT_CARD: "Tarjeta de Débito",
  PAYPAL: "PayPal",
};

const TICKET_STATUS_META: Record<
  TicketStatus,
  { label: string; color: string }
> = {
  ACTIVE: { label: "Activo", color: "processing" },
  PAID: { label: "Pagado", color: "success" },
  COMPLETED: { label: "Completado", color: "default" },
  CANCELLED: { label: "Cancelado", color: "error" },
};

const LIST_SCROLL_STYLE: React.CSSProperties = {
  minHeight: "172px",
  maxHeight: "172px",
  overflowY: "auto",
  paddingRight: "4px",
  flex: 1,
};

interface RecentActivityCardProps {
  loading: boolean;
  tickets: Ticket[];
  payments: Payment[];
}

export function RecentActivityCard({
  loading,
  tickets,
  payments,
}: RecentActivityCardProps) {
  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} lg={12}>
        <Card
          size="small"
          loading={loading}
          title={<span style={{ fontSize: 13 }}>Tickets Recientes</span>}
          style={{
            height: "100%",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
          styles={{ body: { padding: "6px 14px", height: "100%", display: "flex", flexDirection: "column" } }}
        >
          <div style={LIST_SCROLL_STYLE}>
            <List
              size="small"
              dataSource={tickets}
              locale={{ emptyText: "No hay tickets para mostrar." }}
              renderItem={(ticket) => {
                const plate =
                  ticket.vehiclePlateNumber ||
                  ticket.plateNumber ||
                  ticket.vehicle?.plateNumber ||
                  "Sin matrícula";
                const space =
                  ticket.spaceNumber ||
                  ticket.spot?.spaceNumber ||
                  ticket.spotNumber;
                const statusMeta = TICKET_STATUS_META[ticket.status] ?? {
                  label: ticket.status,
                  color: "default",
                };

                return (
                  <List.Item
                    style={{
                      padding: "6px 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        minWidth: 0,
                      }}
                    >
                      <Space size={6} wrap>
                        <Tag
                          icon={<CarOutlined />}
                          style={{
                            margin: 0,
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: 11.5,
                            color: "#0f172a",
                            backgroundColor: "#f1f5f9",
                            borderColor: "#cbd5e1",
                          }}
                        >
                          {plate}
                        </Tag>
                        {space && (
                          <Tag
                            icon={<EnvironmentOutlined />}
                            color="blue"
                            style={{
                              margin: 0,
                              fontSize: 11,
                              fontWeight: 500,
                            }}
                          >
                            Espacio {space}
                          </Tag>
                        )}
                      </Space>

                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <ClockCircleOutlined style={{ fontSize: 11 }} />
                        Entrada: {formatDateTime(ticket.entranceAt)}
                      </Text>
                    </div>

                    <Tag
                      color={statusMeta.color}
                      style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 600,
                        minWidth: "64px",
                        textAlign: "center",
                        borderRadius: "6px",
                      }}
                    >
                      {statusMeta.label}
                    </Tag>
                  </List.Item>
                );
              }}
            />
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card
          size="small"
          loading={loading}
          title={<span style={{ fontSize: 13 }}>Últimos Cobros en Caja</span>}
          style={{
            height: "100%",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
          styles={{ body: { padding: "6px 14px", height: "100%", display: "flex", flexDirection: "column" } }}
        >
          <div style={LIST_SCROLL_STYLE}>
            <List
              size="small"
              dataSource={payments}
              locale={{ emptyText: "No hay cobros en el período seleccionado." }}
              renderItem={(payment) => {
                const spaceNumber =
                  payment.ticket?.spaceNumber || payment.ticket?.spot?.spaceNumber;
                const isTicket = Boolean(payment.ticket);
                const origin =
                  payment.originLabel ||
                  (isTicket
                    ? spaceNumber
                      ? `Ticket · Espacio ${spaceNumber}`
                      : "Ticket"
                    : "Suscripción");

                return (
                  <List.Item
                    style={{
                      padding: "6px 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        minWidth: 0,
                      }}
                    >
                      <Text strong style={{ fontSize: 12, color: "#0f172a" }}>
                        {origin}
                      </Text>

                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <CreditCardOutlined style={{ fontSize: 11 }} />
                        {METHOD_TEXT[payment.method] ?? payment.method} ·{" "}
                        {formatDateTime(payment.date)}
                      </Text>
                    </div>

                    <Text
                      strong
                      style={{
                        color: "#15803d",
                        fontSize: 12.5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatMoney(Number(payment.amount || 0))}
                    </Text>
                  </List.Item>
                );
              }}
            />
          </div>
        </Card>
      </Col>
    </Row>
  );
}