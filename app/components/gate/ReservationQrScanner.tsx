"use client";

import React, { useState } from "react";
import {
  Alert,
  Button,
  Form,
  Input,
  Segmented,
  Typography,
  message as antMessage,
} from "antd";
import {
  BarcodeOutlined,
  CarOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import { validateReservationQr } from "@/app/lib/api/reservations";
import {
  SubscriptionsService,
  type Subscription,
} from "@/app/lib/api/subscriptions";

const { Text } = Typography;

export interface ReservationRecord {
  id: number;
  qrCode?: string;
  qr_code?: string;
  isSubscriptionPass?: boolean;
  vehiclePlateNumber?: string | null;
  vehicle_plate_number?: string | null;
  parkingSpaceId?: number | string | null;
  parkingLotId?: number;
  parkingLotName?: string;
  parkingSpaceNumber?: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  parkingSpace?: {
    id?: number;
    spaceNumber?: string;
    floor?: {
      lot?: {
        id?: number;
        name?: string;
      };
    };
  } | null;
}

interface ReservationQrScannerProps {
  entryType?: "SIN_RESERVACION" | "CON_RESERVACION";
  setEntryType?: (val: "SIN_RESERVACION" | "CON_RESERVACION") => void;
  reservationCode: string;
  setReservationCode: (val: string) => void;
  onResolved: (reservation: ReservationRecord) => Promise<void> | void;
  loading: boolean;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;

  if (typeof error === "string") {
    return error.trim() || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object") {
    const errObj = error as {
      message?: unknown;
      statusText?: unknown;
      data?: { message?: unknown };
      body?: { message?: unknown };
      response?: { data?: { message?: unknown } };
    };

    const candidate =
      errObj.data?.message ??
      errObj.body?.message ??
      errObj.response?.data?.message ??
      errObj.message ??
      errObj.statusText;

    if (Array.isArray(candidate)) {
      const joined = candidate.map(String).filter(Boolean).join(", ");
      if (joined) return joined;
    } else if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return fallback;
}

function resolveSubscriptionMatch(
  subs: Subscription[],
  code: string,
): Subscription | undefined {
  const normalized = code.trim().toUpperCase();

  const exactMatch = subs.find((sub) => {
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

  if (exactMatch) return exactMatch;

  const trailingIdMatch = normalized.match(/(\d+)$/);
  if (trailingIdMatch) {
    const numericId = Number(trailingIdMatch[1]);
    return subs.find((sub) => Number(sub.id) === numericId);
  }

  return undefined;
}

function formatSubscriptionLocation(sub: Subscription): string {
  const spaceNum = sub.parkingSpace?.spaceNumber
    ? `Espacio ${sub.parkingSpace.spaceNumber}`
    : "";
  const lotName = sub.rate?.parkingLot?.name || "";

  if (spaceNum && lotName) return `${spaceNum} · ${lotName}`;
  if (spaceNum) return spaceNum;
  if (lotName) return lotName;
  if (sub.parkingSpaceId) return `Espacio #${sub.parkingSpaceId}`;
  return "N/A";
}

async function validateQrCodeRequest(rawCode: string): Promise<ReservationRecord> {
  const code = String(rawCode ?? "").trim();

  if (!code) {
    throw new Error(
      "Debes pegar o ingresar el código de reservación o suscripción.",
    );
  }

  if (code.toUpperCase().startsWith("SUB-")) {
    const subs = await SubscriptionsService.findAll();
    const matchedSub = resolveSubscriptionMatch(subs, code);

    if (!matchedSub) {
      throw new Error(
        "No se encontró ninguna suscripción registrada con ese código QR.",
      );
    }

    const firstPlate = matchedSub.plateNumbers
      ? String(matchedSub.plateNumbers)
          .split(",")
          .map((p) => p.trim())
          .find(Boolean) || null
      : null;

    const lotId = matchedSub.rate?.parkingLot?.id;
    const lotName = matchedSub.rate?.parkingLot?.name;
    const locationLabel = formatSubscriptionLocation(matchedSub);

    return {
      id: matchedSub.id,
      qrCode: code,
      isSubscriptionPass: true,
      vehiclePlateNumber: firstPlate,
      vehicle_plate_number: firstPlate,
      parkingSpaceId:
        matchedSub.parkingSpaceId ?? matchedSub.parkingSpace?.id ?? null,
      parkingLotId: lotId,
      parkingLotName: lotName,
      parkingSpaceNumber: locationLabel,
      startTime: matchedSub.startDate,
      endTime: matchedSub.endDate,
      parkingSpace: {
        id: matchedSub.parkingSpace?.id,
        spaceNumber: locationLabel,
        floor: {
          lot: {
            id: lotId,
            name: lotName,
          },
        },
      },
    };
  }

  const sourceData = (await validateReservationQr(
    code,
  )) as ReservationRecord | null;

  if (!sourceData || typeof sourceData !== "object") {
    throw new Error("La respuesta de validación de reserva no es válida.");
  }

  return {
    ...sourceData,
    qrCode: sourceData.qrCode ?? sourceData.qr_code ?? code,
    parkingSpace:
      sourceData.parkingSpace ??
      (sourceData.parkingLotId
        ? { floor: { lot: { id: Number(sourceData.parkingLotId) } } }
        : null),
  };
}

export default function ReservationQrScanner({
  entryType = "CON_RESERVACION",
  setEntryType,
  reservationCode,
  setReservationCode,
  onResolved,
  loading,
}: ReservationQrScannerProps) {
  const [validating, setValidating] = useState(false);

  const handleConfirm = async () => {
    if (loading || validating) return;

    setValidating(true);
    try {
      let reservation: ReservationRecord;
      try {
        reservation = await validateQrCodeRequest(reservationCode);
      } catch (validationError: unknown) {
        const msg = extractErrorMessage(
          validationError,
          "No se encontró ninguna reservación o suscripción con ese código QR.",
        );
        antMessage.error(msg);
        return;
      }

      try {
        await onResolved(reservation);
      } catch (resolvedError: unknown) {
        const msg = extractErrorMessage(
          resolvedError,
          "No se pudo completar el ingreso.",
        );
        antMessage.error(msg);
      }
    } finally {
      setValidating(false);
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
      {setEntryType && (
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
          onChange={(val) => {
            const next = val as "SIN_RESERVACION" | "CON_RESERVACION";
            if (next === "SIN_RESERVACION") setReservationCode("");
            setEntryType(next);
          }}
          style={{ padding: "4px" }}
        />
      )}

      <Form layout="vertical" requiredMark={false}>
        <Form.Item
          label={
            <Text strong style={{ color: "#334155" }}>
              Código de Reservación / Suscripción (QR)
            </Text>
          }
          style={{ marginBottom: "12px" }}
        >
          <Input
            size="large"
            allowClear
            placeholder="Pegar código ej.: RES-QR-... o SUB-QR-..."
            value={reservationCode}
            onChange={(e) => setReservationCode(e.target.value.trim())}
            style={{
              width: "100%",
              borderRadius: "8px",
              fontFamily: "monospace",
            }}
            prefix={<BarcodeOutlined style={{ color: "#0284c7" }} />}
          />
        </Form.Item>

        <Alert
          title="Simulación de Lectura QR"
          description="Pega o escanea el código QR de una reserva o suscripción para validar su vigencia y generar el ticket."
          type="info"
          showIcon
          style={{ borderRadius: "8px", marginBottom: "14px" }}
        />

        <Button
          size="large"
          type="primary"
          onClick={() => {
            void handleConfirm();
          }}
          loading={loading || validating}
          icon={<FileDoneOutlined />}
          style={{
            width: "100%",
            height: "48px",
            fontWeight: 600,
            fontSize: "15px",
            borderRadius: "8px",
          }}
        >
          Validar QR y Generar Ticket
        </Button>
      </Form>
    </div>
  );
}