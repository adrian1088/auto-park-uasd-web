"use client";

import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

interface Props {
  totalCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
}

export const ReservationKPIs: React.FC<Props> = ({
  totalCount,
  confirmedCount,
  completedCount,
  cancelledCount,
}) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless">
          <Statistic
            title="Total Reservas"
            value={totalCount}
            prefix={<CalendarOutlined style={{ color: "#0f172a" }} />}
            styles={{ content: { color: "#0f172a" } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless">
          <Statistic
            title="Confirmadas / Por Llegar"
            value={confirmedCount}
            prefix={<ClockCircleOutlined style={{ color: "#1890ff" }} />}
            styles={{ content: { color: "#1890ff" } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless">
          <Statistic
            title="Completadas"
            value={completedCount}
            prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            styles={{ content: { color: "#52c41a" } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless">
          <Statistic
            title="Canceladas / Expiradas"
            value={cancelledCount}
            prefix={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
            styles={{ content: { color: "#ff4d4f" } }}
          />
        </Card>
      </Col>
    </Row>
  );
};