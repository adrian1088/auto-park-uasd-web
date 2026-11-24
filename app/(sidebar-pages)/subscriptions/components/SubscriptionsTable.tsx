"use client";

import React from "react";
import { Table, Button, Tag, Space, Tooltip, Popconfirm, Typography, Dropdown, MenuProps, message } from "antd";
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
  CopyOutlined,
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
  const normalizedStatus = String(record.status || "").trim().toUpperCase();

  if (normalizedStatus === "PAUSED" || normalizedStatus === "INACTIVE") {
    return (
      <Tag color="orange" style={{ borderRadius: "12px", padding: "1px 8px", fontWeight: 600 }}>
        {normalizedStatus === "INACTIVE" ? "INACTIVA" : "PAUSADA"}
      </Tag>
    );
  }

  const isExpired = dayjs().isAfter(dayjs(record.endDate)) || normalizedStatus === "EXPIRED";
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
  const [messageApi, contextHolder] = message.useMessage();

  const handleCopyQr = async (qrCode: string) => {
    try {
      await navigator.clipboard.writeText(qrCode);
      messageApi.success("Código QR de suscripción copiado.");
    } catch {
      messageApi.warning("No se pudo copiar el código QR.");
    }
  };

  const columns = [
    {
      title: "Cliente / Abonado",
      key: "user",
      width: "22%",
      render: (_: unknown, record: Subscription) => (
        <Space orientation="vertical" size={0}>
          <Text strong style={{ fontSize: "14px", color: "#0f172a" }}>
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
            style={{
              fontSize: 12,
              fontWeight: 600,
              borderRadius: "6px",
              padding: "2px 8px",
              color: "#1e3a8a",
              backgroundColor: "#eff6ff",
              borderColor: "#bfdbfe",
            }}
          >
            {spaceNum ? spaceNum : "Sin espacio"}
          </Tag>
        );
      },
    },
    {
      title: "Código QR",
      key: "qrCode",
      width: "16%",
      render: (_: unknown, record: Subscription) => {
        const qr = (record as unknown as { qrCode?: string | null }).qrCode?.trim() || "";
        if (!qr) {
          return <Text type="secondary" style={{ fontSize: 12 }}>Sin QR</Text>;
        }
        return (
          <Space size={4}>
            <Tooltip title={qr}>
              <Tag
                icon={<QrcodeOutlined />}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: "4px",
                  margin: 0,
                  color: "#0284c7",
                  backgroundColor: "#f0f9ff",
                  borderColor: "#bae6fd",
                }}
              >
                QR Listo
              </Tag>
            </Tooltip>
            <Tooltip title="Copiar código QR">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined style={{ color: "#1d4ed8" }} />}
                onClick={() => void handleCopyQr(qr)}
              />
            </Tooltip>
          </Space>
        );
      },
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
                <Tag
                  key={idx}
                  icon={<CarOutlined />}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: "4px",
                    color: "#0f172a",
                    backgroundColor: "#f1f5f9",
                    borderColor: "#cbd5e1",
                  }}
                >
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
      width: "16%",
      render: (_: unknown, record: Subscription) => (
        <Text style={{ fontSize: 12, color: "#334155" }}>
          <CalendarOutlined style={{ marginRight: 4, color: "#0284c7" }} />
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
            icon: <HistoryOutlined style={{ color: "#1d4ed8" }} />,
            onClick: () => onHistory(record),
          },
          {
            key: "pause",
            label: record.status === "PAUSED" ? "Reanudar Suscripción" : "Pausar Suscripción",
            icon:
              record.status === "PAUSED" ? (
                <PlayCircleOutlined style={{ color: "#0284c7" }} />
              ) : (
                <PauseCircleOutlined style={{ color: "#0284c7" }} />
              ),
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
            <Button
              type={isExpired ? "primary" : "default"}
              danger={isExpired}
              size="small"
              icon={<DollarOutlined />}
              style={{
                fontWeight: 600,
                borderRadius: "4px",
                ...(isExpired
                  ? {}
                  : {
                      color: "#1d4ed8",
                      borderColor: "#bfdbfe",
                      backgroundColor: "#f8fafc",
                    }),
              }}
              onClick={() => onRenew(record)}
            >
              Renovar
            </Button>

            <Tooltip title="Editar suscripción / espacio">
              <Button
                type="default"
                size="small"
                icon={<EditOutlined style={{ color: "#0f172a" }} />}
                style={{ borderColor: "#cbd5e1" }}
                onClick={() => onEdit(record)}
              />
            </Tooltip>

            <Dropdown menu={{ items: moreItems }} trigger={["click"]} placement="bottomRight">
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined style={{ fontSize: "16px", color: "#0f172a" }} />}
              />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <Table
        columns={columns}
        dataSource={subscriptions}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8, responsive: true }}
        scroll={{ x: "100%" }}
      />
    </>
  );
};