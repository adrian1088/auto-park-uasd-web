"use client";

import React, { useEffect, useState } from "react";
import { Form, Input, Button, Segmented, Typography } from "antd";
import {
  CarOutlined,
  BarcodeOutlined,
  FileDoneOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface CheckInFormProps {
  entryType: "SIN_RESERVACION" | "CON_RESERVACION";
  setEntryType: (val: "SIN_RESERVACION" | "CON_RESERVACION") => void;
  plateNumber: string;
  setPlateNumber: (val: string) => void;
  userId?: number | null;
  setUserId?: (val: number | null) => void;
  reservationCode: string;
  setReservationCode: (val: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

function formatCurrentDateTime(date: Date): string {
  const formattedDate = date.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${formattedDate} · ${formattedTime}`;
}

export default function CheckInForm({
  entryType,
  setEntryType,
  plateNumber,
  setPlateNumber,
  setUserId,
  setReservationCode,
  onSubmit,
  loading,
}: CheckInFormProps) {
  const [currentDateTime, setCurrentDateTime] = useState<string>(() =>
    formatCurrentDateTime(new Date()),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(formatCurrentDateTime(new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleModeChange = (
    nextMode: "SIN_RESERVACION" | "CON_RESERVACION",
  ) => {
    setEntryType(nextMode);
    if (nextMode === "SIN_RESERVACION") {
      setReservationCode("");
    } else {
      setPlateNumber("");
      setUserId?.(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
      }}
    >
      <Segmented
        block
        size="large"
        options={[
          {
            label: "Sin Reservación (Directo)",
            value: "SIN_RESERVACION",
            icon: <CarOutlined />,
          },
          {
            label: "Con Reservación",
            value: "CON_RESERVACION",
            icon: <BarcodeOutlined />,
          },
        ]}
        value={entryType}
        onChange={(val) =>
          handleModeChange(val as "SIN_RESERVACION" | "CON_RESERVACION")
        }
        style={{ padding: "4px" }}
      />

      <Form layout="vertical" requiredMark={false}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.1fr",
            gap: "12px",
          }}
        >
          <Form.Item
            label={
              <Text strong style={{ color: "#334155" }}>
                Matrícula / Placa
              </Text>
            }
            style={{ marginBottom: "16px" }}
          >
            <Input
              size="large"
              placeholder="Ej: A-123456"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              style={{ width: "100%", borderRadius: "8px", fontWeight: "bold" }}
              prefix={<CarOutlined style={{ color: "#0284c7" }} />}
            />
          </Form.Item>

          <Form.Item
            label={
              <Text strong style={{ color: "#334155" }}>
                Fecha y Hora Actual
              </Text>
            }
            style={{ marginBottom: "16px" }}
          >
            <Input
              size="large"
              value={currentDateTime}
              disabled
              readOnly
              style={{ width: "100%", borderRadius: "8px", fontWeight: 600 }}
              prefix={<ClockCircleOutlined style={{ color: "#0284c7" }} />}
            />
          </Form.Item>
        </div>
      </Form>

      <Button
        size="large"
        type="primary"
        onClick={onSubmit}
        loading={loading}
        icon={<FileDoneOutlined />}
        style={{
          width: "100%",
          height: "48px",
          fontWeight: 600,
          fontSize: "15px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(24, 144, 255, 0.25)",
        }}
      >
        Registrar Entrada y Asignar Espacio
      </Button>
    </div>
  );
}
