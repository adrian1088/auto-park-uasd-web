"use client";

import React from "react";
import { Button, Card, Col, Input, Row, Select } from "antd";
import { ClearOutlined, SearchOutlined } from "@ant-design/icons";
import type { PaymentMethod } from "@/app/lib/api/payments";

export type DateRangeFilter = "TODAY" | "7D" | "MONTH" | "ALL";

interface DashboardFiltersProps {
  dateRange: DateRangeFilter;
  methodFilter: PaymentMethod | "ALL";
  searchText: string;
  onDateRangeChange: (value: DateRangeFilter) => void;
  onMethodFilterChange: (value: PaymentMethod | "ALL") => void;
  onSearchTextChange: (value: string) => void;
  onClear: () => void;
}

export function DashboardFilters({
  dateRange,
  methodFilter,
  searchText,
  onDateRangeChange,
  onMethodFilterChange,
  onSearchTextChange,
  onClear,
}: DashboardFiltersProps) {
  return (
    <Card
      size="small"
      style={{
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
      }}
      styles={{ body: { padding: "10px 14px" } }}
    >
      <Row gutter={[10, 10]} align="middle">
        <Col xs={24} sm={12} md={6}>
          <Select
            size="small"
            style={{ width: "100%" }}
            value={dateRange}
            onChange={(val) => onDateRangeChange(val)}
            options={[
              { label: "Período: Hoy", value: "TODAY" },
              { label: "Período: Últimos 7 días", value: "7D" },
              { label: "Período: Este mes", value: "MONTH" },
              { label: "Período: Todo el historial", value: "ALL" },
            ]}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Select
            size="small"
            style={{ width: "100%" }}
            value={methodFilter}
            onChange={(val) => onMethodFilterChange(val)}
            options={[
              { label: "Método: Todos", value: "ALL" },
              { label: "Efectivo", value: "CASH" },
              { label: "Tarjeta de Crédito", value: "CREDIT_CARD" },
              { label: "Tarjeta de Débito", value: "DEBIT_CARD" },
              { label: "PayPal", value: "PAYPAL" },
            ]}
          />
        </Col>

        <Col xs={24} sm={16} md={8}>
          <Input
            size="small"
            allowClear
            placeholder="Filtrar por matrícula o espacio..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
          />
        </Col>

        <Col xs={24} sm={8} md={4}>
          <Button block size="small" icon={<ClearOutlined />} onClick={onClear}>
            Limpiar
          </Button>
        </Col>
      </Row>
    </Card>
  );
}