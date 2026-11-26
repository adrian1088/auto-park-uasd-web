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
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless" style={{ borderRadius: 10 }}>
          <Statistic
            title="Total Reservas"
            value={totalCount}
            prefix={<CalendarOutlined style={{ color: "#0f172a" }} />}
            styles={{ content: { color: "#0f172a", fontWeight: 700 } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless" style={{ borderRadius: 10 }}>
          <Statistic
            title="Vigentes / Por Llegar"
            value={confirmedCount}
            prefix={<ClockCircleOutlined style={{ color: "#0284c7" }} />}
            styles={{ content: { color: "#0284c7", fontWeight: 700 } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless" style={{ borderRadius: 10 }}>
          <Statistic
            title="Completadas"
            value={completedCount}
            prefix={<CheckCircleOutlined style={{ color: "#16a34a" }} />}
            styles={{ content: { color: "#16a34a", fontWeight: 700 } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless" style={{ borderRadius: 10 }}>
          <Statistic
            title="Vencidas / Canceladas"
            value={cancelledCount}
            prefix={<CloseCircleOutlined style={{ color: "#dc2626" }} />}
            styles={{ content: { color: "#dc2626", fontWeight: 700 } }}
          />
        </Card>
      </Col>
    </Row>
  );
};