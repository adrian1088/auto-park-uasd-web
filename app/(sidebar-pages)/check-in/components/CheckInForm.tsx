"use client";

import React, { useEffect, useState } from "react";
import { Form, Input, Button, Segmented, Typography } from "antd";
import {
  CarOutlined,
  BarcodeOutlined,
  FileDoneOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  SubscriptionsService,
  type Subscription,
} from "@/app/lib/api/subscriptions";

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

function findMatchingSubscription(
  subscriptions: Subscription[],
  rawInput: string,
): Subscription | undefined {
  const normalized = rawInput.trim().toUpperCase();
  if (!normalized) return undefined;

  if (normalized.startsWith("SUB-")) {
    const exactCodeMatch = subscriptions.find((sub) => {
      const rec = sub as unknown as Record<string, unknown>;
      const candidates = [
        rec.qrCode,
        rec.qr_code,
        rec.code,
        `SUB-${sub.id}`,
        `SUB-QR-${sub.id}`,
      ]
        .filter((v) => v !== undefined && v !== null)
        .map((v) => String(v).trim().toUpperCase());

      return candidates.includes(normalized);
    });

    if (exactCodeMatch) return exactCodeMatch;

    const trailingDigits = normalized.match(/(\d+)$/);
    if (trailingDigits) {
      const targetId = Number(trailingDigits[1]);
      return subscriptions.find((sub) => Number(sub.id) === targetId);
    }
  }

  return subscriptions.find((sub) => {
    const plates = String(sub.plateNumbers || "")
      .split(",")
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean);
    return plates.includes(normalized);
  });
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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [matchedSubscription, setMatchedSubscription] =
    useState<Subscription | null>(null);

  useEffect(() => {
    let active = true;
    SubscriptionsService.findAll()
      .then((list) => {
        if (active) {
          setSubscriptions(Array.isArray(list) ? list : []);
        }
      })
      .catch(() => {
        if (active) {
          setSubscriptions([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(formatCurrentDateTime(new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const syncSubscriptionData = (rawValue: string) => {
    const upperValue = rawValue.toUpperCase();
    const matched = findMatchingSubscription(subscriptions, upperValue);

    if (matched) {
      setMatchedSubscription(matched);
      const firstPlate =
        String(matched.plateNumbers || "")
          .split(",")
          .map((p) => p.trim().toUpperCase())
          .find(Boolean) || upperValue;

      setPlateNumber(firstPlate);
      setUserId?.(matched.userId ?? null);

      if (upperValue.startsWith("SUB-")) {
        setReservationCode(upperValue);
      } else {
        setReservationCode(`SUB-${matched.id}`);
      }
      return;
    }

    setMatchedSubscription(null);
    setPlateNumber(upperValue);
    setUserId?.(null);
    if (upperValue.startsWith("SUB-")) {
      setReservationCode(upperValue);
    } else {
      setReservationCode("");
    }
  };

  const handleModeChange = (
    nextMode: "SIN_RESERVACION" | "CON_RESERVACION",
  ) => {
    setEntryType(nextMode);
    setMatchedSubscription(null);
    if (nextMode === "SIN_RESERVACION") {
      setReservationCode("");
    } else {
      setPlateNumber("");
      setUserId?.(null);
    }
  };

  const locationSummary = matchedSubscription
    ? [
        matchedSubscription.parkingSpace?.spaceNumber
          ? `Espacio ${matchedSubscription.parkingSpace.spaceNumber}`
          : matchedSubscription.parkingSpaceId
            ? `Espacio #${matchedSubscription.parkingSpaceId}`
            : "",
        matchedSubscription.rate?.parkingLot?.name || "",
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

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
              placeholder="Ej: A-123456 o SUB-..."
              value={plateNumber}
              onChange={(e) => syncSubscriptionData(e.target.value)}
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

        {matchedSubscription && (
          <div style={{ marginBottom: "12px" }}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Suscriptor: <strong>{matchedSubscription.user?.name || `ID #${matchedSubscription.userId}`}</strong>
              {locationSummary ? ` · ${locationSummary}` : ""}
            </Text>
          </div>
        )}
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