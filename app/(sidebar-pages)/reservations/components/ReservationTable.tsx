"use client";

import React from "react";
import { Table, Tag, Space, Button, Typography, Card, Tooltip } from "antd";
import { QrcodeOutlined, EnvironmentOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Reservation } from "@/app/lib/api/reservations";

const { Text } = Typography;

interface Props {
  data: Reservation[];
  loading: boolean;
  onCancel: (id: number) => void;
}

export const ReservationTable: React.FC<Props> = ({ data, loading, onCancel }) => {
  const renderStatusTag = (record: Reservation) => {
    const currentStatus = record.status || "CONFIRMED";
    const isExpired =
      currentStatus === "CONFIRMED" &&
      dayjs().isAfter(dayjs(record.startTime).add(20, "minute"));

    if (isExpired) {
      return (
        <Tag color="red" style={{ borderRadius: "12px", fontWeight: 600 }}>
          NO SE PRESENTÓ (VENCIDA)
        </Tag>
      );
    }

    const map: Record<string, { color: string; text: string }> = {
      CONFIRMED: { color: "blue", text: "CONFIRMADA / ESPERANDO" },
      COMPLETED: { color: "green", text: "EN PARQUEO" },
      CANCELLED: { color: "volcano", text: "CANCELADA" },
      NO_SHOW: { color: "red", text: "NO SE PRESENTÓ" },
    };
    const config = map[currentStatus] || { color: "default", text: currentStatus };
    return (
      <Tag color={config.color} style={{ borderRadius: "12px", fontWeight: 600 }}>
        {config.text}
      </Tag>
    );
  };

  const columns = [
    {
      title: "Código / ID",
      dataIndex: "id",
      key: "id",
      width: "14%",
      render: (id: number) => (
        <Text strong style={{ color: "#1890ff" }}>
          RES-{id.toString().padStart(5, "0")}
        </Text>
      ),
    },
    {
      title: "Cliente / Usuario",
      key: "user",
      width: "22%",
      render: (_: unknown, record: Reservation) => (
        <Space orientation="vertical" size={0}>
          <Text strong style={{ fontSize: "14px" }}>
            {record.user?.name || `Usuario ID: ${record.userId}`}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.user?.email || "Sin correo"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Acceso / QR",
      key: "qrStatus",
      width: "15%",
      render: () => (
        <Tooltip title="Se ha enviado un código QR dinámico al correo del cliente con la guía de entrada">
          <Tag icon={<QrcodeOutlined />} color="cyan" style={{ borderRadius: "4px", fontWeight: 600, padding: "2px 8px" }}>
            QR Enviado al Correo
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "Espacio Asignado",
      key: "space",
      width: "16%",
      render: (_: unknown, record: Reservation) => {
        const spaceNum =
          record.parkingSpace?.spaceNumber ||
          record.spot?.spaceNumber ||
          record.parkingSpaceId;
        return spaceNum ? (
          <Tag icon={<EnvironmentOutlined />} color="blue" style={{ borderRadius: "4px", fontWeight: 600 }}>
            Espacio #{spaceNum}
          </Tag>
        ) : (
          <Tag icon={<EnvironmentOutlined />} color="purple" style={{ borderRadius: "4px", fontWeight: 600 }}>
            ASIGNACIÓN AL LLEGAR
          </Tag>
        );
      },
    },
    {
      title: "Hora Estimada de Entrada",
      key: "time",
      width: "18%",
      render: (_: unknown, record: Reservation) => (
        <Space orientation="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>
            <CalendarOutlined style={{ marginRight: 4, color: "#8c8c8c" }} />
            {dayjs(record.startTime).format("DD/MM/YYYY - HH:mm A")}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Tolerancia hasta: {dayjs(record.startTime).add(20, "minute").format("HH:mm A")}
          </Text>
        </Space>
      ),
    },
    {
      title: "Estado",
      key: "status",
      width: "15%",
      render: (_: unknown, record: Reservation) => renderStatusTag(record),
    },
    {
      title: "Acciones",
      key: "actions",
      align: "center" as const,
      width: "10%",
      render: (_: unknown, record: Reservation) => {
        const currentStatus = record.status || "CONFIRMED";
        const isExpired =
          currentStatus === "CONFIRMED" &&
          dayjs().isAfter(dayjs(record.startTime).add(20, "minute"));

        if (isExpired || currentStatus === "CANCELLED" || currentStatus === "COMPLETED") {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Button danger size="small" style={{ borderRadius: "4px" }} onClick={() => onCancel(record.id)}>
            Cancelar
          </Button>
        );
      },
    },
  ];

  return (
    <Card styles={{ body: { padding: 0 } }}>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8, responsive: true }}
        scroll={{ x: "100%" }}
      />
    </Card>
  );
};