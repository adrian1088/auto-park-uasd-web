"use client";

import React, { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { Modal, Button, Typography, Space, message as antMessage, Card, Alert, Tag, Tooltip } from "antd";
import { CheckCircleOutlined, BugOutlined, ReloadOutlined } from "@ant-design/icons";
import QRCode from "qrcode";
import KioskTicket from "../../components/gate/Ticket";
import Success from "../../components/gate/Success";

import CheckInForm from "./components/CheckInForm";
import ParkingMap from "../../components/map/ParkingMap";
import ReservationQrScanner, {
  type ReservationRecord,
} from "../../components/gate/ReservationQrScanner";
import { processGateEntry, GateEntryResult } from "@/app/lib/api/gate";
import { checkInTicket, type Ticket } from "@/app/lib/api/tickets";
import { getParkingSpaces } from "@/app/lib/api/spaces";

const { Title, Text, Paragraph } = Typography;

interface DiagnosticState {
  status: "CHECKING" | "OK" | "WARNING" | "ERROR";
  message: string;
  details?: string;
}

type ExtendedGateEntryResult = GateEntryResult & {
  rateAmount?: number | string | null;
  rate_amount?: number | string | null;
  isSubscription?: boolean;
};

type TicketLikeResponse = Ticket & {
  vehicle_plate_number?: string;
  space_number?: string;
  spot_number?: string;
  entrance_at?: string;
  rate_amount?: number | string;
  rate?: { amount?: number | string };
  reservation?: {
    id?: number;
    vehiclePlateNumber?: string | null;
    vehicle_plate_number?: string | null;
    parkingSpace?: { spaceNumber?: string; space_number?: string } | null;
  } | null;
};

function mapTicketToReceipt(
  createdTicket: TicketLikeResponse,
  fallbackPlate: string,
): ExtendedGateEntryResult {
  const plate =
    createdTicket.vehiclePlateNumber ||
    createdTicket.vehicle_plate_number ||
    createdTicket.plateNumber ||
    createdTicket.vehicle?.plateNumber ||
    createdTicket.reservation?.vehiclePlateNumber ||
    createdTicket.reservation?.vehicle_plate_number ||
    fallbackPlate ||
    "N/A";

  const space =
    createdTicket.spot?.spaceNumber ||
    createdTicket.spaceNumber ||
    createdTicket.space_number ||
    createdTicket.spotNumber ||
    createdTicket.spot_number ||
    createdTicket.reservation?.parkingSpace?.spaceNumber ||
    createdTicket.reservation?.parkingSpace?.space_number ||
    "ASIGNADO";

  const resolvedRate =
    createdTicket.rateAmount ??
    createdTicket.rate_amount ??
    createdTicket.rate?.amount ??
    null;

  return {
    ticketId: createdTicket.id,
    ticketNumber: createdTicket.code,
    plateNumber: String(plate).trim().toUpperCase() || "N/A",
    hasReservation: Boolean(createdTicket.reservation),
    assignedSpace: String(space).trim() || "ASIGNADO",
    entryTime: createdTicket.entranceAt || createdTicket.entrance_at || new Date().toISOString(),
    rateAmount: resolvedRate,
    isSubscription: false,
  };
}

export default function CheckInPage() {
  const [entryType, setEntryType] = useState<"SIN_RESERVACION" | "CON_RESERVACION">("SIN_RESERVACION");
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [showReceiptView, setShowReceiptView] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [] = useTransition();

  const [plateNumber, setPlateNumber] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  const [reservationCode, setReservationCode] = useState<string>("");

  const [ticketResult, setTicketResult] = useState<ExtendedGateEntryResult | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticState | null>(null);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const kioskDict = {
    printingTicket: "TICKET GENERADO CON ÉXITO",
    takeTicket: "SEDE UNIVERSITARIA UASD (LOTE 1)",
    ticketInstruction: "Entregue el comprobante al conductor",
    parkingReceipt: "Comprobante de Estacionamiento - Operador",
    plateLabel: "MATRÍCULA:",
    dateTimeLabel: "FECHA / HORA:",
    locationLabel: "UBICACIÓN:",
    rateLabel: "TARIFA:",
  };

  const successDict = {
    barrierOpenTitle: "BARRERA ABIERTA",
    driveCarefully: "Conduzca con precaución hacia su espacio asignado.",
    closingIn: "Cerrando en",
  };

  const renderTicketQr = useCallback((gateResult: GateEntryResult, fallbackPlate: string) => {
    setTimeout(() => {
      if (qrCanvasRef.current && gateResult) {
        const tCode = gateResult.ticketNumber || `TCK-${Date.now()}`;
        const pNum = gateResult.plateNumber || fallbackPlate || "S/N";
        const space = gateResult.assignedSpace || "GENERAL";

        const qrPayload = `AUTOPARK|${tCode}|${pNum}|${space}`;

        QRCode.toCanvas(
          qrCanvasRef.current,
          qrPayload,
          { width: 74, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } },
          (error: Error | null | undefined) => {
            if (error) console.error("Error al renderizar QR en canvas:", error);
          },
        );
      }
    }, 150);
  }, []);

  const handleCheckInError = useCallback((error: unknown) => {
    const err = error as {
      status?: number;
      message?: unknown;
      data?: { message?: unknown };
      body?: { message?: unknown };
      response?: { status?: number; data?: { message?: unknown } };
    };
    const rawMessage =
      err.data?.message ??
      err.body?.message ??
      err.response?.data?.message ??
      err.message ??
      "";
    const serverMessage = Array.isArray(rawMessage)
      ? rawMessage.map(String).filter(Boolean).join(", ")
      : typeof rawMessage === "string"
        ? rawMessage
        : String(rawMessage || "");
    const status = err.status || err.response?.status;
    const normalizedMsg = serverMessage.toLowerCase();

    if (normalizedMsg.includes("compatible")) {
      antMessage.info(
        "El espacio reservado no es compatible con el vehículo",
      );
      return;
    }

    if (
      status === 400 ||
      normalizedMsg.includes("espacio") ||
      normalizedMsg.includes("lleno") ||
      normalizedMsg.includes("capacidad") ||
      normalizedMsg.includes("matrícula") ||
      normalizedMsg.includes("bad request")
    ) {
      antMessage.warning(
        serverMessage ||
          "⚠️ El estacionamiento se encuentra lleno o la matrícula no está disponible en este momento.",
      );
    } else {
      antMessage.error(serverMessage || "Error al procesar el acceso en la garita.");
    }
  }, []);

  const runSystemDiagnostic = useCallback(async () => {
    setDiagnostic({
      status: "CHECKING",
      message: "Diagnosticando conexión con la API...",
    });

    try {
      const spacesList = await getParkingSpaces(1);
      const safeSpaces = Array.isArray(spacesList) ? spacesList : [];

      if (safeSpaces.length === 0) {
        setDiagnostic({
          status: "WARNING",
          message: "La API devolvió 0 espacios registrados para el Lote ID 1.",
          details: "Crea espacios de parqueo en Configuración.",
        });
      } else {
        setDiagnostic({
          status: "OK",
          message: `Conexión exitosa. Se detectaron ${safeSpaces.length} espacios activos.`,
        });
      }
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        message?: string;
        response?: { status?: number; statusText?: string };
      };
      const status = err?.status || err?.response?.status;

      if (status === 401) {
        setDiagnostic({
          status: "ERROR",
          message: "Error HTTP 401: No autorizado (Token JWT ausente o expirado).",
          details: "Inicia sesión nuevamente en el sistema.",
        });
        return;
      }

      if (status) {
        setDiagnostic({
          status: "ERROR",
          message: `El backend respondió con un error HTTP ${status}: ${err?.response?.statusText || err?.message || ""}`,
          details: "Verifica que el servicio esté activo en NestJS.",
        });
        return;
      }

      setDiagnostic({
        status: "ERROR",
        message: "No se pudo establecer conexión con la API",
        details: `Detalle: ${err?.message || "Error de red"}`,
      });
    }
  }, []);

  useEffect(() => {
    if (!isModalVisible || showReceiptView) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsModalVisible(false);
          setShowReceiptView(false);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [isModalVisible, showReceiptView, countdown]);

  useEffect(() => {
    if (isModalVisible && showReceiptView && ticketResult) {
      renderTicketQr(ticketResult, plateNumber);
    }
  }, [isModalVisible, showReceiptView, ticketResult, plateNumber, renderTicketQr]);

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setShowReceiptView(false);
    setCountdown(5);
  };

  const openSuccessModalWithTicket = (gateResult: ExtendedGateEntryResult, plateUsed: string) => {
    setTicketResult(gateResult);
    setShowReceiptView(true);
    setCountdown(5);
    setIsModalVisible(true);
    setRefreshTrigger((prev: number) => prev + 1);
    renderTicketQr(gateResult, plateUsed);
  };

  const handleProcessCheckIn = async () => {
    if (loading) return;

    const cleanPlate = plateNumber.trim().toUpperCase();
    if (cleanPlate.length < 4) {
      antMessage.warning("Ingresa una matrícula válida (mínimo 4 caracteres).");
      return;
    }

    setLoading(true);
    try {
      const createdTicket = await checkInTicket({
        plateNumber: cleanPlate,
        parkingLotId: 1,
      });

      const mappedResult = mapTicketToReceipt(createdTicket, cleanPlate);
      openSuccessModalWithTicket(mappedResult, cleanPlate);
      antMessage.success("¡Entrada registrada y espacio asignado con éxito!");

      setPlateNumber("");
      setUserId(null);
    } catch (error: unknown) {
      handleCheckInError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReservationResolved = async (reservation: ReservationRecord) => {
    if (loading) return;
    setLoading(true);
    try {
      const resPlate = String(
        reservation.vehiclePlateNumber ?? reservation.vehicle_plate_number ?? "",
      )
        .trim()
        .toUpperCase();
      const numericReservationId = Number(reservation.id);

      if (
        !reservation.isSubscriptionPass &&
        Number.isInteger(numericReservationId) &&
        numericReservationId > 0
      ) {
        const createdTicket = await checkInTicket({
          reservationId: numericReservationId,
        });

        const mappedResult = mapTicketToReceipt(createdTicket, resPlate || "RESERVA");
        openSuccessModalWithTicket(mappedResult, resPlate || "RESERVA");
        antMessage.success("¡Reserva validada y ticket generado con éxito!");
        setReservationCode("");
        return;
      }

      if (reservation.isSubscriptionPass) {
        const subSpace =
          (reservation as ReservationRecord & { parkingSpaceNumber?: string })
            .parkingSpaceNumber ||
          reservation.parkingSpace?.spaceNumber ||
          (reservation as ReservationRecord & { parkingLotName?: string })
            .parkingLotName ||
          "N/A";
        const subCode =
          reservation.qrCode ?? reservation.qr_code ?? reservationCode.trim();
        const subPlate = resPlate || "N/A";

        openSuccessModalWithTicket(
          {
            ticketId: reservation.id || 0,
            ticketNumber: subCode,
            plateNumber: subPlate,
            hasReservation: true,
            assignedSpace: subSpace,
            entryTime: new Date().toISOString(),
            rateAmount: null,
            isSubscription: true,
          },
          subPlate,
        );
        antMessage.success("¡Suscripción validada y ticket generado con éxito!");
        setReservationCode("");
        return;
      }

      const lotId = reservation.parkingSpace?.floor?.lot?.id ?? 1;
      const plateForGate = resPlate || "AUTO";
      const codeToSend =
        reservation.qrCode ?? reservation.qr_code ?? reservationCode.trim();

      const gateResult = await processGateEntry(
        plateForGate,
        lotId,
        "MANUAL",
        codeToSend,
      );
      if (!gateResult) {
        throw new Error("No se pudo procesar la entrada en la garita.");
      }

      openSuccessModalWithTicket(gateResult, plateForGate);
      antMessage.success("¡Suscripción validada y ticket generado con éxito!");

      setReservationCode("");
    } catch (error: unknown) {
      handleCheckInError(error);
    } finally {
      setLoading(false);
    }
  };

  const formattedTicketTime = ticketResult?.entryTime
    ? new Date(ticketResult.entryTime).toLocaleString("es-DO", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "20/10/26 12:00";

  const ticketRate = ticketResult?.rateAmount ?? ticketResult?.rate_amount ?? null;

  return (
    <div style={{ padding: "24px", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            Registrar Entrada - Control de Garita
          </Title>
          <Paragraph type="secondary" style={{ margin: "2px 0 0 0", fontSize: "14px" }}>
            Control de acceso en tiempo real y asignación de espacios.
          </Paragraph>
        </div>
        <Space>
          <Tooltip title="Ejecutar prueba de diagnóstico de API">
            <Button
              icon={<BugOutlined />}
              onClick={runSystemDiagnostic}
              loading={diagnostic?.status === "CHECKING"}
            >
              Diagnosticar Conexión
            </Button>
          </Tooltip>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => setRefreshTrigger((prev: number) => prev + 1)}
          >
            Refrescar Vista
          </Button>
        </Space>
      </div>

      {diagnostic && diagnostic.status !== "OK" && diagnostic.status !== "CHECKING" && (
        <Alert
          message={
            <Space>
              <Text strong>{diagnostic.message}</Text>
              <Tag color={diagnostic.status === "ERROR" ? "error" : "warning"}>
                {diagnostic.status}
              </Tag>
            </Space>
          }
          description={diagnostic.details}
          type={diagnostic.status === "ERROR" ? "error" : "warning"}
          showIcon
          closable
          style={{ marginBottom: "20px", borderRadius: "10px", border: "1px solid #fecaca" }}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "20px", alignItems: "start" }}>
        <Card style={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} styles={{ body: { padding: "20px" } }}>
          {entryType === "CON_RESERVACION" ? (
            <ReservationQrScanner
              entryType={entryType}
              setEntryType={setEntryType}
              reservationCode={reservationCode}
              setReservationCode={setReservationCode}
              onResolved={handleReservationResolved}
              loading={loading}
            />
          ) : (
            <CheckInForm
              entryType={entryType}
              setEntryType={setEntryType}
              plateNumber={plateNumber}
              setPlateNumber={setPlateNumber}
              userId={userId}
              setUserId={setUserId}
              reservationCode={reservationCode}
              setReservationCode={setReservationCode}
              onSubmit={handleProcessCheckIn}
              loading={loading}
            />
          )}
        </Card>

        <ParkingMap refreshTrigger={refreshTrigger} />
      </div>

      <Modal
        title={
          showReceiptView ? (
            <Space align="center" style={{ paddingBottom: "4px" }}>
              <CheckCircleOutlined
                style={{
                  color: ticketResult?.hasReservation ? "#52c41a" : "#0284c7",
                  fontSize: "18px",
                }}
              />
              <Text strong style={{ fontSize: "16px" }}>
                {ticketResult?.hasReservation
                  ? "Comprobante de Entrada - Abonado / Reserva"
                  : "Comprobante de Entrada (Visitante)"}
              </Text>
            </Space>
          ) : null
        }
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={
          showReceiptView
            ? [
                <Button
                  key="to-success"
                  type="primary"
                  onClick={() => {
                    setCountdown(5);
                    setShowReceiptView(false);
                  }}
                  style={{
                    borderRadius: "6px",
                    width: "100%",
                    backgroundColor: ticketResult?.hasReservation ? "#16a34a" : "#0284c7",
                  }}
                >
                  Continuar a Barrera
                </Button>,
              ]
            : [
                <Button key="view-ticket" onClick={() => setShowReceiptView(true)}>
                  Ver Ticket
                </Button>,
                <Button key="close-now" type="primary" onClick={handleCloseModal}>
                  Listo
                </Button>,
              ]
        }
        width={showReceiptView ? 430 : 680}
        centered
        destroyOnHidden
      >
        {showReceiptView ? (
          <div style={{ padding: "6px 0" }}>
            {ticketResult?.hasReservation && (
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  marginBottom: "10px",
                  textAlign: "center",
                }}
              >
                <Text strong style={{ color: "#166534", fontSize: "12px" }}>
                  CLIENTE FIJO / RESERVA
                </Text>
              </div>
            )}

            {ticketResult && (
              <KioskTicket
                qrCanvasRef={qrCanvasRef}
                ticketTimeVal={formattedTicketTime}
                ticketCodeVal={ticketResult.ticketNumber}
                plateNumberVal={ticketResult.plateNumber}
                assignedSpaceVal={ticketResult.assignedSpace}
                rateVal={ticketRate}
                isSubscription={Boolean(ticketResult.isSubscription)}
                dict={kioskDict}
              />
            )}
          </div>
        ) : (
          <Success countdown={countdown} dict={successDict} />
        )}
      </Modal>
    </div>
  );
}