"use client";

import React from "react";
import { Form, Input, InputNumber, Radio, Button, Segmented, Alert, Typography } from "antd";
import { CarOutlined, BarcodeOutlined, FileDoneOutlined, UserOutlined } from "@ant-design/icons";
import { VehicleType } from "../page";

const { Text } = Typography;

interface CheckInFormProps {
  entryType: "SIN_RESERVACION" | "CON_RESERVACION";
  setEntryType: (val: "SIN_RESERVACION" | "CON_RESERVACION") => void;
  plateNumber: string;
  setPlateNumber: (val: string) => void;
  userId: number | null;
  setUserId: (val: number | null) => void;
  vehicleType: VehicleType;
  setVehicleType: (val: VehicleType) => void;
  reservationId: number | null;
  setReservationId: (val: number | null) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function CheckInForm({
  entryType,
  setEntryType,
  plateNumber,
  setPlateNumber,
  userId,
  setUserId,
  vehicleType,
  setVehicleType,
  reservationId,
  setReservationId,
  onSubmit,
  loading,
}: CheckInFormProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      <Segmented
        block
        size="large"
        options={[
          { label: "Sin Reservación (Directo)", value: "SIN_RESERVACION", icon: <CarOutlined /> },
          { label: "Con Reservación", value: "CON_RESERVACION", icon: <BarcodeOutlined /> },
        ]}
        value={entryType}
        onChange={(val) => setEntryType(val as "SIN_RESERVACION" | "CON_RESERVACION")}
        style={{ padding: "4px" }}
      />

      {entryType === "SIN_RESERVACION" ? (
        <Form layout="vertical" requiredMark={false}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "12px" }}>
            <Form.Item label={<Text strong style={{ color: "#334155" }}>Matrícula / Placa</Text>} style={{ marginBottom: "16px" }}>
              <Input
                size="large"
                placeholder="Ej: A-123456"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                style={{ width: "100%", borderRadius: "8px", fontWeight: "bold" }}
                prefix={<CarOutlined style={{ color: "#0284c7" }} />}
              />
            </Form.Item>
            <Form.Item label={<Text strong style={{ color: "#334155" }}>ID Usuario (Opcional)</Text>} style={{ marginBottom: "16px" }}>
              <InputNumber
                size="large"
                placeholder="Ej: 1"
                value={userId}
                onChange={(val) => setUserId(val ? Number(val) : null)}
                style={{ width: "100%", borderRadius: "8px" }}
                prefix={<UserOutlined style={{ color: "#94a3b8" }} />}
              />
            </Form.Item>
          </div>

          <Form.Item label={<Text strong style={{ color: "#334155" }}>Tipo de Vehículo (Sede UASD)</Text>}>
            <Radio.Group
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              size="middle"
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}
            >
              <Radio.Button value={VehicleType.CAR} style={{ textAlign: "center", borderRadius: "6px" }}>Carro</Radio.Button>
              <Radio.Button value={VehicleType.SUV} style={{ textAlign: "center", borderRadius: "6px" }}>Jeepeta</Radio.Button>
              <Radio.Button value={VehicleType.PICKUP} style={{ textAlign: "center", borderRadius: "6px" }}>Camioneta</Radio.Button>
              <Radio.Button value={VehicleType.VAN} style={{ textAlign: "center", borderRadius: "6px" }}>Van</Radio.Button>
              <Radio.Button value={VehicleType.BUS} style={{ textAlign: "center", borderRadius: "6px" }}>Bus</Radio.Button>
              <Radio.Button value={VehicleType.MOTORCYCLE} style={{ textAlign: "center", borderRadius: "6px" }}>Moto</Radio.Button>
              <Radio.Button value={VehicleType.TRUCK} style={{ textAlign: "center", borderRadius: "6px" }}>Camión</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Form>
      ) : (
        <Form layout="vertical" requiredMark={false}>
          <Form.Item label={<Text strong style={{ color: "#334155" }}>ID de la Reservación</Text>}>
            <InputNumber
              size="large"
              placeholder="Ej: 15"
              value={reservationId}
              onChange={(val) => setReservationId(val ? Number(val) : null)}
              style={{ width: "100%", borderRadius: "8px" }}
              prefix={<BarcodeOutlined style={{ color: "#0284c7" }} />}
            />
          </Form.Item>
          <Alert
            title="Asignación Dinámica al Escanear/Ingresar ID"
            description="El sistema verificará la reserva activa e imprimirá el ticket asignando automáticamente el primer espacio libre o la celda del cupo reservado."
            type="info"
            showIcon
            style={{ borderRadius: "8px", marginBottom: "16px" }}
          />
        </Form>
      )}

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