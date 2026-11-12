"use client";

import React, { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { Modal, Button, Typography, Space, message as antMessage, Card, Alert, Tag, Tooltip } from "antd";
import { CheckCircleOutlined, BugOutlined, ReloadOutlined } from "@ant-design/icons";
import QRCode from "qrcode";
import KioskTicket from "@/app/customer-panel/components/Ticket";

import CheckInForm from "./components/CheckInForm";
import ParkingMap from "./components/ParkingMap";
import { processGateEntry, GateEntryResult } from "@/app/lib/api/gate";

const { Title, Text, Paragraph } = Typography;

export enum VehicleType {
  CAR = "CAR",
  TRUCK = "TRUCK",
  MOTORCYCLE = "MOTORCYCLE",
  VAN = "VAN",
  BUS = "BUS",
  SUV = "SUV",
  PICKUP = "PICKUP",
}

interface DiagnosticState {
  status: "CHECKING" | "OK" | "WARNING" | "ERROR";
  message: string;
  details?: string;
}

export default function CheckInPage() {
  const [entryType, setEntryType] = useState<"SIN_RESERVACION" | "CON_RESERVACION">("SIN_RESERVACION");
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [, startTransition] = useTransition();

  const [plateNumber, setPlateNumber] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.CAR);
  const [reservationId, setReservationId] = useState<number | null>(null);
  
  const [ticketResult, setTicketResult] = useState<GateEntryResult | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticState | null>(null);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const kioskDict = {
    printingTicket: "TICKET GENERADO CON ÉXITO",
    takeTicket: "SEDE UNIVERSITARIA UASD (LOTE 1)",
    ticketInstruction: "Entregue el comprobante impreso al conductor",
    parkingReceipt: "Comprobante de Estacionamiento - Operador",
    plateLabel: "MATRÍCULA:",
    dateTimeLabel: "FECHA / HORA:",
    locationLabel: "UBICACIÓN:",
    rateLabel: "TARIFA:",
  };

  const runSystemDiagnostic = useCallback(async () => {
    setDiagnostic({
      status: "CHECKING",
      message: "Diagnosticando conexión con la API...",
    });

    try {
      const res = await fetch("http://localhost:3001/api/v1/parking/spaces?lotId=1", {
        credentials: "include",
      });
      
      if (res.status === 401) {
        setDiagnostic({
          status: "ERROR",
          message: "Error HTTP 401: No autorizado (Token JWT ausente o expirado).",
          details: "Inicia sesión nuevamente en el sistema.",
        });
        return;
      }

      if (!res.ok) {
        setDiagnostic({
          status: "ERROR",
          message: `El backend respondió con un error HTTP ${res.status}: ${res.statusText}`,
          details: "Verifica que el servicio esté activo en NestJS.",
        });
        return;
      }

      const result = await res.json();
      const spacesList = Array.isArray(result) ? result : result?.data || [];

      if (spacesList.length === 0) {
        setDiagnostic({
          status: "WARNING",
          message: "La API devolvió 0 espacios registrados para el Lote ID 1.",
          details: "Crea espacios de parqueo en Configuración.",
        });
      } else {
        setDiagnostic({
          status: "OK",
          message: `Conexión exitosa. Se detectaron ${spacesList.length} espacios activos.`,
        });
      }
    } catch (error: unknown) {
      const err = error as Error;
      setDiagnostic({
        status: "ERROR",
        message: "No se pudo establecer conexión con http://localhost:3001/api/v1",
        details: `Detalle: ${err.message}`,
      });
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      runSystemDiagnostic();
    });
  }, [runSystemDiagnostic]);

  const handleProcessCheckIn = async () => {
    if (entryType === "CON_RESERVACION" && !reservationId) {
      antMessage.warning("Por favor, ingrese el ID de la reservación.");
      return;
    }

    setLoading(true);
    try {
      let gateResult: GateEntryResult | null = null;

      if (entryType === "CON_RESERVACION" && reservationId) {
        // Validación con ID de reserva para asignación dinámica en backend
        gateResult = await processGateEntry("RESERVA", 1, "AUTOMATIC_LPR");
      } else {
        const isManualInput = Boolean(plateNumber && plateNumber.trim() !== "");
        const plateToSend = isManualInput ? plateNumber.trim().toUpperCase() : "AUTO";
        const entrySource = isManualInput ? "MANUAL" : "AUTOMATIC_LPR";

        gateResult = await processGateEntry(plateToSend, 1, entrySource);
      }

      if (!gateResult) {
        throw new Error("No se pudo procesar la entrada en la garita.");
      }

      setTicketResult(gateResult);
      setIsModalVisible(true);
      antMessage.success("¡Entrada registrada y espacio asignado con éxito!");

      // Limpiar campos y actualizar mapa en tiempo real
      setPlateNumber("");
      setUserId(null);
      setReservationId(null);
      setRefreshTrigger((prev: number) => prev + 1);

      // Generar código QR con datos garantizados
      setTimeout(() => {
        if (qrCanvasRef.current && gateResult) {
          const tCode = gateResult.ticketNumber || `TCK-${Date.now()}`;
          const pNum = gateResult.plateNumber || plateNumber || "S/N";
          const space = gateResult.assignedSpace || "GENERAL";

          const qrPayload = `AUTOPARK|${tCode}|${pNum}|${space}`;

          QRCode.toCanvas(
            qrCanvasRef.current,
            qrPayload,
            { width: 180, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } },
            (error: Error | null | undefined) => {
              if (error) console.error("Error al renderizar QR en canvas:", error);
            }
          );
        }
      }, 150);
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string; data?: { message?: string } };
      const serverMessage = err.data?.message || err.message || "";
      const status = err.status || (error as { response?: { status?: number } }).response?.status;
      
      if (
        status === 400 ||
        serverMessage.toLowerCase().includes("espacio") || 
        serverMessage.toLowerCase().includes("lleno") || 
        serverMessage.toLowerCase().includes("capacidad") ||
        serverMessage.toLowerCase().includes("matrícula") ||
        serverMessage.toLowerCase().includes("bad request")
      ) {
        antMessage.warning("⚠️ El estacionamiento se encuentra lleno o la matrícula no está disponible en este momento.");
      } else {
        antMessage.error(serverMessage || "Error al procesar el acceso en la garita.");
      }
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

  return (
    <div style={{ padding: "24px", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Cabecera Principal */}
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

      {/* Grid de 2 Columnas (Formulario de Check-In + Mapa de Estacionamiento) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "20px", alignItems: "start" }}>
        {/* Columna 1: Formulario */}
        <Card style={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} styles={{ body: { padding: "20px" } }}>
          <CheckInForm
            entryType={entryType}
            setEntryType={setEntryType}
            plateNumber={plateNumber}
            setPlateNumber={setPlateNumber}
            userId={userId}
            setUserId={setUserId}
            vehicleType={vehicleType}
            setVehicleType={setVehicleType}
            reservationId={reservationId}
            setReservationId={setReservationId}
            onSubmit={handleProcessCheckIn}
            loading={loading}
          />
        </Card>

        {/* Columna 2: Mapa de Estacionamiento Interactivo */}
        <ParkingMap refreshTrigger={refreshTrigger} />
      </div>

      {/* Modal de Ticket Generado */}
      <Modal
        title={
          <Space align="center" style={{ paddingBottom: "8px" }}>
            <CheckCircleOutlined style={{ color: ticketResult?.hasReservation ? "#52c41a" : "#0284c7", fontSize: "20px" }} />
            <Text strong style={{ fontSize: "18px" }}>
              {ticketResult?.hasReservation ? "Comprobante de Entrada - Abonado / Reserva" : "Comprobante de Entrada (Visitante)"}
            </Text>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button
            key="print"
            type="primary"
            size="large"
            onClick={() => setIsModalVisible(false)}
            style={{ borderRadius: "6px", width: "100%", backgroundColor: ticketResult?.hasReservation ? "#16a34a" : "#0284c7" }}
          >
            Imprimir Comprobante y Abrir Barrera
          </Button>,
        ]}
        width={550}
        centered
        destroyOnHidden
      >
        <div style={{ padding: "12px 0" }}>
          {ticketResult?.hasReservation && (
            <div style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              padding: "8px 12px",
              marginBottom: "14px",
              textAlign: "center"
            }}>
              <Text strong style={{ color: "#166534", fontSize: "13px" }}>
                ✓ RECONOCIDO COMO CLIENTE FIJO / RESERVA: Acceso exento de pago a la salida.
              </Text>
            </div>
          )}

          {ticketResult && (
            <KioskTicket
              qrCanvasRef={qrCanvasRef}
              ticketTimeVal={formattedTicketTime}
              ticketCodeVal={ticketResult.ticketNumber}
              dict={kioskDict}
            />
          )}  
        </div>
      </Modal>
    </div>
  );
}