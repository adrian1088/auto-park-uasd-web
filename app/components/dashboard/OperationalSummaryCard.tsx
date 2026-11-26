"use client";

import React from "react";
import { Card, Divider, Flex, Tag, Typography } from "antd";
import { formatMoney } from "@/app/lib/utils/format";

const { Text } = Typography;

export interface OperationalSummaryCardProps {
  loading: boolean;
  activeTicketsCount: number;
  totalTicketsCount: number;
  reservationsTotal: number;
  activeSubscriptionsCount: number;
  totalSubscriptionsCount: number;
  periodRevenue: number;
  periodPaymentsCount: number;
  isAdmin?: boolean;
}

export function OperationalSummaryCard({
  loading,
  activeTicketsCount,
  totalTicketsCount,
  reservationsTotal,
  activeSubscriptionsCount,
  totalSubscriptionsCount,
  periodRevenue,
  periodPaymentsCount,
  isAdmin = true,
}: OperationalSummaryCardProps) {
  return (
    <Card
      size="small"
      loading={loading}
      title={<span style={{ fontSize: 13 }}>Resumen del Turno</span>}
      style={{
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
        height: "100%",
      }}
      styles={{ body: { padding: "12px 14px" } }}
    >
      <Flex vertical gap={10}>
        <Flex justify="space-between" align="center">
          <Text type="secondary" style={{ fontSize: 12 }}>
            Tickets activos / cargados
          </Text>
          <Tag color="processing" style={{ margin: 0, fontSize: 11 }}>
            {activeTicketsCount} / {totalTicketsCount}
          </Tag>
        </Flex>

        <Flex justify="space-between" align="center">
          <Text type="secondary" style={{ fontSize: 12 }}>
            Reservaciones registradas
          </Text>
          <Text strong style={{ fontSize: 12 }}>
            {reservationsTotal}
          </Text>
        </Flex>

        {isAdmin && (
          <>
            <Divider style={{ margin: "2px 0" }} />

            <Flex justify="space-between" align="center">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Abonados vigentes
              </Text>
              <Text strong style={{ fontSize: 12 }}>
                {activeSubscriptionsCount} / {totalSubscriptionsCount}
              </Text>
            </Flex>

            <Flex justify="space-between" align="center">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Cobros en el período
              </Text>
              <Text strong style={{ fontSize: 12 }}>
                {periodPaymentsCount}
              </Text>
            </Flex>

            <Flex justify="space-between" align="center">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Total del período
              </Text>
              <Text strong style={{ fontSize: 13, color: "#16a34a" }}>
                {formatMoney(periodRevenue)}
              </Text>
            </Flex>
          </>
        )}
      </Flex>
    </Card>
  );
}