"use client";

import React from "react";
import { Card, Col, Flex, Progress, Row, Typography } from "antd";
import type { PaymentMethod } from "@/app/lib/api/payments";
import type { ParkingSpaceStatus } from "@/app/lib/api/spaces";
import { formatMoney } from "@/app/lib/utils/format";

const { Text } = Typography;

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CREDIT_CARD: "Tarjeta de Crédito",
  DEBIT_CARD: "Tarjeta de Débito",
  PAYPAL: "PayPal",
};

const SPACE_STATUS_CONFIG: Array<{
  status: ParkingSpaceStatus;
  label: string;
  color: string;
}> = [
  { status: "FREE", label: "Libres", color: "#16a34a" },
  { status: "OCCUPIED", label: "Ocupados", color: "#0284c7" },
  { status: "RESERVED", label: "Reservados", color: "#d97706" },
  { status: "OUT_OF_SERVICE", label: "Fuera de Servicio", color: "#dc2626" },
];

interface DashboardChartsAndOccupancyProps {
  loading: boolean;
  revenueByMethod: Record<PaymentMethod, number>;
  totalPeriodRevenue: number;
  spaceCountsByStatus: Record<ParkingSpaceStatus, number>;
  totalSpaces: number;
}

export function DashboardChartsAndOccupancy({
  loading,
  revenueByMethod,
  totalPeriodRevenue,
  spaceCountsByStatus,
  totalSpaces,
}: DashboardChartsAndOccupancyProps) {
  const methods: PaymentMethod[] = [
    "CASH",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "PAYPAL",
  ];

  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} lg={12}>
        <Card
          size="small"
          loading={loading}
          title={<span style={{ fontSize: 13 }}>Ingresos por Método de Pago</span>}
          style={{
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
          styles={{ body: { padding: "12px 14px" } }}
        >
          <Flex vertical gap={8}>
            {methods.map((method) => {
              const amount = revenueByMethod[method] ?? 0;
              const percent =
                totalPeriodRevenue > 0
                  ? Math.round((amount / totalPeriodRevenue) * 100)
                  : 0;
              return (
                <Flex key={method} vertical gap={2}>
                  <Flex justify="space-between">
                    <Text strong style={{ fontSize: 12 }}>
                      {METHOD_LABELS[method]}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatMoney(amount)} ({percent}%)
                    </Text>
                  </Flex>
                  <Progress
                    size="small"
                    percent={percent}
                    showInfo={false}
                    strokeColor="#0284c7"
                  />
                </Flex>
              );
            })}
          </Flex>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card
          size="small"
          loading={loading}
          title={<span style={{ fontSize: 13 }}>Estado de Espacios del Parqueo</span>}
          style={{
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
          styles={{ body: { padding: "12px 14px" } }}
        >
          <Flex vertical gap={8}>
            {SPACE_STATUS_CONFIG.map(({ status, label, color }) => {
              const count = spaceCountsByStatus[status] ?? 0;
              const percent =
                totalSpaces > 0 ? Math.round((count / totalSpaces) * 100) : 0;
              return (
                <Flex key={status} vertical gap={2}>
                  <Flex justify="space-between">
                    <Text strong style={{ fontSize: 12 }}>
                      {label}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {count} espacios ({percent}%)
                    </Text>
                  </Flex>
                  <Progress
                    size="small"
                    percent={percent}
                    showInfo={false}
                    strokeColor={color}
                  />
                </Flex>
              );
            })}
          </Flex>
        </Card>
      </Col>
    </Row>
  );
}
