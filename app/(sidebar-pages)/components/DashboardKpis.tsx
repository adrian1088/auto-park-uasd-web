"use client";

import React from "react";
import { Card, Col, Row, Statistic, Typography } from "antd";
import {
  CarOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { formatMoney } from "@/app/lib/utils/format";

const { Text } = Typography;

export interface DashboardKpisProps {
  loading: boolean;
  totalSpaces: number;
  occupiedSpaces: number;
  freeSpaces: number;
  activeTicketsCount: number;
  periodRevenue: number;
  periodPaymentsCount: number;
  activeSubscriptionsCount: number;
  totalSubscriptionsCount: number;
}

export function DashboardKpis({
  loading,
  totalSpaces,
  occupiedSpaces,
  freeSpaces,
  activeTicketsCount,
  periodRevenue,
  periodPaymentsCount,
  activeSubscriptionsCount,
  totalSubscriptionsCount,
}: DashboardKpisProps) {
  const occupancyRate =
    totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0;

  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} sm={12} lg={6}>
        <Card
          size="small"
          loading={loading}
          style={{
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
          styles={{ body: { padding: "12px 14px" } }}
        >
          <Statistic
            title={<span style={{ fontSize: 12 }}>Ocupación de Espacios</span>}
            value={`${occupiedSpaces} / ${totalSpaces}`}
            styles={{ content: { fontSize: 18 } }}
            prefix={
              <EnvironmentOutlined style={{ color: "#0284c7", fontSize: 15 }} />
            }
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {freeSpaces} libres · {occupancyRate}% ocupado
          </Text>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          size="small"
          loading={loading}
          style={{
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
          styles={{ body: { padding: "12px 14px" } }}
        >
          <Statistic
            title={<span style={{ fontSize: 12 }}>Tickets Activos</span>}
            value={activeTicketsCount}
            styles={{ content: { color: "#0284c7", fontSize: 18 } }}
            prefix={<CarOutlined style={{ fontSize: 15 }} />}
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            Vehículos actualmente en parqueo
          </Text>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          size="small"
          loading={loading}
          style={{
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
          styles={{ body: { padding: "12px 14px" } }}
        >
          <Statistic
            title={<span style={{ fontSize: 12 }}>Ingresos del Período</span>}
            value={formatMoney(periodRevenue)}
            styles={{ content: { color: "#16a34a", fontSize: 18 } }}
            prefix={<DollarOutlined style={{ fontSize: 15 }} />}
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {periodPaymentsCount} cobros registrados
          </Text>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          size="small"
          loading={loading}
          style={{
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
          styles={{ body: { padding: "12px 14px" } }}
        >
          <Statistic
            title={<span style={{ fontSize: 12 }}>Abonados Activos</span>}
            value={activeSubscriptionsCount}
            styles={{ content: { color: "#0f172a", fontSize: 18 } }}
            prefix={
              <UsergroupAddOutlined style={{ color: "#0284c7", fontSize: 15 }} />
            }
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {totalSubscriptionsCount} suscripciones totales
          </Text>
        </Card>
      </Col>
    </Row>
  );
}