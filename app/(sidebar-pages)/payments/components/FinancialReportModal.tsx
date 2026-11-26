"use client";

import React from "react";
import { Modal, Button, Typography, Divider, Row, Col, Statistic, Table, Tag, Space, Flex, Card } from "antd";
import { PrinterOutlined, FileTextOutlined } from "@ant-design/icons";
import { Payment, PaymentMethod } from "@/app/lib/api/payments";
import { formatMoney, formatDateTime } from "@/app/lib/utils/format";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CREDIT_CARD: "Tarjeta de crédito",
  DEBIT_CARD: "Tarjeta de débito",
  PAYPAL: "PayPal",
};

interface FinancialReportModalProps {
  open: boolean;
  payments: Payment[];
  onClose: () => void;
}

export const FinancialReportModal: React.FC<FinancialReportModalProps> = ({
  open,
  payments,
  onClose,
}) => {
  const now = dayjs();
  const todayStr = now.format("YYYY-MM-DD");

  let totalRevenue = 0;
  let todayRevenue = 0;
  let monthRevenue = 0;
  
  const methodTotals: Record<string, number> = {
    CASH: 0,
    CREDIT_CARD: 0,
    DEBIT_CARD: 0,
    PAYPAL: 0,
  };

  payments.forEach((p) => {
    const amount = Number(p.amount || 0);
    totalRevenue += amount;

    const pDate = p.date ? dayjs(p.date) : now;
    if (pDate.format("YYYY-MM-DD") === todayStr) {
      todayRevenue += amount;
    }
    if (pDate.isSame(now, "month") && pDate.isSame(now, "year")) {
      monthRevenue += amount;
    }

    if (p.method && methodTotals[p.method] !== undefined) {
      methodTotals[p.method] += amount;
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const summaryColumns = [
    {
      title: "Método de Pago",
      key: "method",
      render: (_: unknown, record: { method: string; total: number; count: number }) => (
        <Tag color="blue">{paymentMethodLabels[record.method as PaymentMethod] || record.method}</Tag>
      ),
    },
    {
      title: "Cantidad de Transacciones",
      dataIndex: "count",
      key: "count",
    },
    {
      title: "Monto Recaudado",
      dataIndex: "total",
      key: "total",
      render: (val: number) => <Text strong style={{ color: "#3f8600" }}>{formatMoney(val)}</Text>,
    },
  ];

  const summaryData = Object.entries(methodTotals).map(([method, total]) => ({
    method,
    total,
    count: payments.filter((p) => p.method === method).length,
  }));

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined style={{ color: "#1677ff", fontSize: 20 }} />
          <span>Reporte Financiero Consolidado y Auditoría de Caja</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="print" type="default" icon={<PrinterOutlined />} onClick={handlePrint}>
          Imprimir / Guardar PDF
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Cerrar Reporte
        </Button>,
      ]}
      destroyOnHidden
    >
      <div id="printable-report" style={{ padding: "8px 16px" }}>
        {/* Cabecera del Reporte */}
        <Flex justify="space-between" align="center">
          <div>
            <Title level={4} style={{ margin: 0 }}>Sistema de Gestión de Parqueo</Title>
            <Text type="secondary">Reporte generado automáticamente por el sistema</Text>
          </div>
          <div style={{ textAlign: "right" }}>
            <Text strong>Fecha de Emisión:</Text>
            <div>{now.format("DD/MM/YYYY HH:mm")}</div>
          </div>
        </Flex>

        <Divider style={{ margin: "16px 0" }} />

        {/* Tarjetas de Resumen General */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card size="small" variant="borderless" style={{ background: "#f6ffed", border: "1px solid #b7eb8f" }}>
              <Statistic title="Recaudación Hoy" value={todayRevenue} precision={2} formatter={(val) => formatMoney(Number(val))} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" variant="borderless" style={{ background: "#e6f4ff", border: "1px solid #91caff" }}>
              <Statistic title="Recaudación del Mes" value={monthRevenue} precision={2} formatter={(val) => formatMoney(Number(val))} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" variant="borderless" style={{ background: "#fff7e6", border: "1px solid #ffd591" }}>
              <Statistic title="Total Histórico Listado" value={totalRevenue} precision={2} formatter={(val) => formatMoney(Number(val))} />
            </Card>
          </Col>
        </Row>

        {/* Desglose por Método de Pago */}
        <Title level={5}>Desglose por Método de Pago</Title>
        <Table
          dataSource={summaryData}
          columns={summaryColumns}
          pagination={false}
          rowKey="method"
          size="small"
          style={{ marginBottom: 24 }}
        />

        {/* Detalle de Transacciones */}
        <Title level={5}>Últimas Transacciones Incluidas en el Reporte</Title>
        <Table
          dataSource={payments.slice(0, 10)}
          columns={[
            { title: "ID", dataIndex: "id", key: "id", render: (id) => `#${id}` },
            { title: "Cliente", key: "user", render: (_, p: Payment) => (p as unknown as { user?: { name?: string } }).user?.name || "General" },
            { title: "Método", dataIndex: "method", key: "method", render: (m) => paymentMethodLabels[m as PaymentMethod] || m },
            { title: "Fecha", dataIndex: "date", key: "date", render: (d) => formatDateTime(d) },
            { title: "Monto", dataIndex: "amount", key: "amount", render: (a) => formatMoney(a) },
          ]}
          pagination={false}
          rowKey="id"
          size="small"
        />
      </div>
    </Modal>
  );
};