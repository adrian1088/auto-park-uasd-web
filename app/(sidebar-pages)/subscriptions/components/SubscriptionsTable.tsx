"use client";

import React from "react";
import { Table, Button, Tag, Space, Tooltip, Popconfirm, Typography, Dropdown, MenuProps } from "antd";
import {
  CarOutlined,
  CalendarOutlined,
  DollarOutlined,
  HistoryOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  QrcodeOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Subscription } from "@/app/lib/api/subscriptions";

const { Text } = Typography;

interface SubscriptionsTableProps {
  subscriptions: Subscription[];
  loading: boolean;
  onRenew: (record: Subscription) => void;
  onHistory: (record: Subscription) => void;
  onEdit: (record: Subscription) => void;
  onTogglePause: (record: Subscription) => void;
  onDelete: (id: number) => void;
}

const renderStatusTag = (record: Subscription) => {
  if (record.status === "PAUSED") {
    return (
      <Tag color="orange" style={{ borderRadius: "12px", padding: "1px 8px", fontWeight: 600 }}>
        PAUSADA
      </Tag>
    );
  }
  const isExpired = dayjs().isAfter(dayjs(record.endDate)) || record.status === "EXPIRED";
  if (isExpired) {
    return (
      <Tag color="red" style={{ borderRadius: "12px", padding: "1px 8px", fontWeight: 600 }}>
        VENCIDA
      </Tag>
    );
  }
  return (
    <Tag color="green" style={{ borderRadius: "12px", padding: "1px 8px", fontWeight: 600 }}>
      ACTIVA
    </Tag>
  );
};

export const SubscriptionsTable: React.FC<SubscriptionsTableProps> = ({
  subscriptions,
  loading,
  onRenew,
  onHistory,
  onEdit,
  onTogglePause,
  onDelete,
}) => {
  const columns = [
    {
      title: "Cliente / Abonado",
      key: "user",
      width: "22%",
      render: (_: unknown, record: Subscription) => (
        <Space orientation="vertical" size={0}>
          <Text strong style={{ fontSize: "14px" }}>
            {record.user?.name || `Usuario #${record.userId}`}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.user?.email || "Sin correo"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Espacio",
      key: "space",
      width: "12%",
      render: (_: unknown, record: Subscription) => {
        const spaceNum = record.parkingSpace?.spaceNumber;
        return (
          <Tag
            icon={<EnvironmentOutlined />}
            color="purple"
            style={{ fontSize: 12, fontWeight: "bold", borderRadius: "6px", padding: "2px 8px" }}
          >
            {spaceNum ? spaceNum : "Sin espacio"}
          </Tag>
        );
      },
    },
    {
      title: "Código QR",
      key: "qrCode",
      width: "12%",
      render: (_: unknown, record: Subscription) => (
        <Tag icon={<QrcodeOutlined />} color="cyan" style={{ fontSize: 11, fontWeight: 600, borderRadius: "4px" }}>
          {(record as unknown as { qrCode?: string }).qrCode ? "QR Listo" : "Sin QR"}
        </Tag>
      ),
    },
    {
      title: "Placas",
      key: "plates",
      width: "14%",
      render: (_: unknown, record: Subscription) => {
        const plates = (record.plateNumbers || "").trim();
        if (!plates) {
          return <Text type="secondary" style={{ fontSize: 12 }}>Sin vehículo</Text>;
        }
        return (
          <Space size={[0, 4]} wrap>
            {plates
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean)
              .map((plate, idx) => (
                <Tag key={idx} icon={<CarOutlined />} color="blue" style={{ fontSize: 11, fontWeight: "bold", borderRadius: "4px" }}>
                  {plate}
                </Tag>
              ))}
          </Space>
        );
      },
    },
    {
      title: "Vigencia",
      key: "validity",
      width: "18%",
      render: (_: unknown, record: Subscription) => (
        <Text style={{ fontSize: 12 }}>
          <CalendarOutlined style={{ marginRight: 4, color: "#8c8c8c" }} />
          {dayjs(record.startDate).format("DD/MM/YYYY")} - {dayjs(record.endDate).format("DD/MM/YYYY")}
        </Text>
      ),
    },
    {
      title: "Estado",
      key: "status",
      width: "10%",
      render: (_: unknown, record: Subscription) => renderStatusTag(record),
    },
    {
      title: "Acciones",
      key: "actions",
      align: "center" as const,
      width: "16%",
      render: (_: unknown, record: Subscription) => {
        const isExpired = dayjs().isAfter(dayjs(record.endDate)) || record.status === "EXPIRED";

        const moreItems: MenuProps["items"] = [
          {
            key: "history",
            label: "Historial de Pagos",
            icon: <HistoryOutlined style={{ color: "#1677ff" }} />,
            onClick: () => onHistory(record),
          },
          {
            key: "pause",
            label: record.status === "PAUSED" ? "Reanudar Suscripción" : "Pausar Suscripción",
            icon: record.status === "PAUSED" ? <PlayCircleOutlined style={{ color: "#fa8c16" }} /> : <PauseCircleOutlined style={{ color: "#fa8c16" }} />,
            onClick: () => onTogglePause(record),
          },
          {
            type: "divider",
          },
          {
            key: "delete",
            label: (
              <Popconfirm
                title="¿Eliminar suscripción?"
                description="Se removerá el espacio asignado."
                okText="Sí, eliminar"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
                onConfirm={() => onDelete(record.id)}
              >
                <span style={{ color: "#ff4d4f" }}>Eliminar</span>
              </Popconfirm>
            ),
            icon: <DeleteOutlined style={{ color: "#ff4d4f" }} />,
            danger: true,
          },
        ];

        return (
          <Space size="small">
            {/* 🚀 Botón de Renovar siempre visible para cualquier abonado */}
            <Button
              type={isExpired ? "primary" : "default"}
              danger={isExpired}
              size="small"
              icon={<DollarOutlined />}
              style={{ fontWeight: 600, borderRadius: "4px" }}
              onClick={() => onRenew(record)}
            >
              Renovar
            </Button>

            {/* Botón principal de Editar */}
            <Tooltip title="Editar suscripción / espacio">
              <Button
                type="default"
                size="small"
                icon={<EditOutlined style={{ color: "#595959" }} />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>

            {/* Menú de tres puntos */}
            <Dropdown menu={{ items: moreItems }} trigger={["click"]} placement="bottomRight">
              <Button type="text" size="small" icon={<MoreOutlined style={{ fontSize: "16px" }} />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];
  
  return (
    <Table
      columns={columns}
      dataSource={subscriptions}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 8, responsive: true }}
      scroll={{ x: "100%" }}
    />
  );
};