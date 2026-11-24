"use client";

import React from "react";
import Link from "next/link";
import { Card, Col, Flex, Row, Typography } from "antd";
import {
  CalendarOutlined,
  CarOutlined,
  DollarOutlined,
  LoginOutlined,
  LogoutOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const QUICK_ACTIONS = [
  {
    key: "check-in",
    label: "Check-In",
    href: "/check-in",
    icon: <LoginOutlined style={{ color: "#0284c7", fontSize: 15 }} />,
    accent: "#0284c7",
    tint: "#f0f9ff",
  },
  {
    key: "check-out",
    label: "Check-Out",
    href: "/check-out",
    icon: <LogoutOutlined style={{ color: "#0f172a", fontSize: 15 }} />,
    accent: "#cbd5e1",
    tint: "#f8fafc",
  },
  {
    key: "subscriptions",
    label: "Clientes Fijos",
    href: "/subscriptions",
    icon: <UsergroupAddOutlined style={{ color: "#0284c7", fontSize: 15 }} />,
    accent: "#cbd5e1",
    tint: "#f8fafc",
  },
  {
    key: "payments",
    label: "Pagos",
    href: "/payments",
    icon: <DollarOutlined style={{ color: "#16a34a", fontSize: 15 }} />,
    accent: "#cbd5e1",
    tint: "#f8fafc",
  },
  {
    key: "reservations",
    label: "Reservaciones",
    href: "/reservations",
    icon: <CalendarOutlined style={{ color: "#0284c7", fontSize: 15 }} />,
    accent: "#cbd5e1",
    tint: "#f8fafc",
  },
  {
    key: "tickets",
    label: "Tickets",
    href: "/tickets",
    icon: <CarOutlined style={{ color: "#475569", fontSize: 15 }} />,
    accent: "#cbd5e1",
    tint: "#f8fafc",
  },
];

export function DashboardQuickActions() {
  return (
    <Card
      size="small"
      title={
        <Text strong style={{ color: "#0f172a", fontSize: 12 }}>
          Accesos Rápidos
        </Text>
      }
      style={{
        borderRadius: "10px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
      }}
      styles={{
        header: { padding: "8px 14px", minHeight: "unset" },
        body: { padding: "10px 14px" },
      }}
    >
      <Row gutter={[8, 8]}>
        {QUICK_ACTIONS.map((action) => (
          <Col key={action.key} xs={12} sm={8} md={4}>
            <Link href={action.href} style={{ display: "block" }}>
              <Flex
                align="center"
                gap={8}
                style={{
                  padding: "7px 10px",
                  borderRadius: "8px",
                  background: action.tint,
                  border: `1px solid ${action.accent}`,
                }}
              >
                {action.icon}
                <Text
                  strong
                  style={{
                    color: "#0f172a",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {action.label}
                </Text>
              </Flex>
            </Link>
          </Col>
        ))}
      </Row>
    </Card>
  );
}