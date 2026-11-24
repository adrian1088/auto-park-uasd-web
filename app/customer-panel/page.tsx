"use client";

import React, {
  useEffect,
  useState,
  useRef,
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { Button, Typography, Space, Segmented } from "antd";
import {
  EnvironmentOutlined,
  GlobalOutlined,
  DownOutlined,
  CustomerServiceOutlined,
  PhoneOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CarOutlined,
  QrcodeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import QRCode from "qrcode";

import KioskInitial from "./components/Initial";
import KioskScanner from "./components/Lpr";
import KioskTicket from "../components/gate/Ticket";
import KioskSuccess from "../components/gate/Success";
import ReservationQrScanner, {
  type ReservationRecord,
} from "../components/gate/ReservationQrScanner";

import { getValidPlates, processGateEntry } from "@/app/lib/api/gate";
import { checkInTicket, type Ticket } from "@/app/lib/api/tickets";

import "./page.css";

const { Title, Text } = Typography;

const DEFAULT_PLATES = ["A-312-XYZ", "B-214-ABC", "C-923-ZZZ", "D-216-WWW", "E-581-QQQ"];
const DEFAULT_LOT_ID = 1;

const TRANSLATIONS = {
  es: {
    barrierOpen: "BARRERA ABIERTA",
    getTicket: "OBTENER TICKET",
    pressTicket: "TOCAR AQUÍ",
    approachVehicle: "Acerque su vehículo a la barra de contención para lectura automática",
    plateRecognition: "RECONOCIMIENTO DE MATRÍCULA",
    scanning: "LEYENDO PLACA LPR...",
    printingTicket: "Imprimiendo ticket…",
    takeTicket: "RETIRE SU TICKET TÉRMICO",
    ticketInstruction: "Por favor tome el boleto impreso en el slot inferior",
    parkingReceipt: "Comprobante de Estacionamiento",
    plateLabel: "MATRÍCULA:",
    dateTimeLabel: "FECHA / HORA:",
    locationLabel: "UBICACIÓN:",
    rateLabel: "TARIFA:",
    barrierOpenTitle: "¡BARRERA ABIERTA!",
    driveCarefully: "AVANCE CON PRECAUCIÓN HASTA SU ESPACIO ASIGNADO",
    closingIn: "Cierre automático en:",
    needHelp: "¿Necesita asistencia personal?",
    pressSupport: "Presione el botón de soporte",
    assistance: "Asistencia",
    calling: "LLAMANDO...",
    connected: "OPERADOR CONECTADO",
  },
  en: {
    barrierOpen: "GATE OPEN",
    getTicket: "GET TICKET",
    pressTicket: "PRESS FOR TICKET • TAP HERE",
    approachVehicle: "Move your vehicle close to the barrier for automatic recognition",
    plateRecognition: "LICENSE PLATE RECOGNITION",
    scanning: "SCANNING PLATE...",
    printingTicket: "Printing ticket…",
    takeTicket: "TAKE YOUR THERMAL TICKET",
    ticketInstruction: "Please take the printed ticket from the lower slot",
    parkingReceipt: "Parking Receipt",
    plateLabel: "LICENSE PLATE:",
    dateTimeLabel: "DATE / TIME:",
    locationLabel: "LOCATION:",
    rateLabel: "RATE:",
    barrierOpenTitle: "GATE OPEN!",
    driveCarefully: "PROCEED CAREFULLY TO YOUR ASSIGNED SPACE",
    closingIn: "Auto-closing in:",
    needHelp: "Do you need personal assistance?",
    pressSupport: "Press the support button",
    assistance: "Assistance",
    calling: "CALLING...",
    connected: "OPERATOR CONNECTED",
  },
} as const;

type TicketExt = Ticket & {
  rate_amount?: number | string | null;
  rate?: { amount?: number | string | null } | null;
};

class AreaErrorBoundary extends Component<
  { children: ReactNode; resetKey: string; onReset: () => void },
  { message: string | null }
> {
  state = { message: null as string | null };

  static getDerivedStateFromError(err: unknown) {
    return { message: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(err: unknown, info: ErrorInfo) {
    console.error("[KioskAreaError]", err, info.componentStack);
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.message) {
      this.setState({ message: null });
    }
  }

  render() {
    if (this.state.message) {
      return (
        <div style={{ textAlign: "center", padding: 16 }}>
          <Text type="danger" style={{ display: "block", marginBottom: 10 }}>
            {this.state.message}
          </Text>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              this.setState({ message: null });
              this.props.onReset();
            }}
          >
            Reiniciar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const getErrMsg = (err: unknown): string => {
  if (!err) return "Error desconocido";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  const o = err as { message?: unknown; body?: { message?: unknown }; data?: { message?: unknown } };
  const raw = o.body?.message ?? o.data?.message ?? o.message ?? err;
  return Array.isArray(raw) ? raw.join(", ") : String(raw);
};

export default function CustomerPanelPage() {
  const [lang, setLang] = useState<"es" | "en">("es");
  const [entryType, setEntryType] = useState<"SIN_RESERVACION" | "CON_RESERVACION">("SIN_RESERVACION");
  const [reservationCode, setReservationCode] = useState("");
  const [reservationLoading, setReservationLoading] = useState(false);

  const [liveTime, setLiveTime] = useState("12:00:00");
  const [liveDate, setLiveDate] = useState("martes, 20 de octubre de 2026");

  const [step, setStep] = useState<"initial" | "lpr" | "ticket" | "open">("initial");
  const [lprSubtitle, setLprSubtitle] = useState("Procesando imagen LPR en tiempo real…");
  const [ticketTimeVal, setTicketTimeVal] = useState("20/10/26 12:00");
  const [ticketCodeVal, setTicketCodeVal] = useState("TK-89421094");
  const [scannedPlate, setScannedPlate] = useState(DEFAULT_PLATES[0]);
  const [assignedSpaceVal, setAssignedSpaceVal] = useState("N/A");
  const [ticketRateVal, setTicketRateVal] = useState<number | string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [countdown, setCountdown] = useState(5);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportConnected, setSupportConnected] = useState(false);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const flowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const dict = TRANSLATIONS[lang];

  const clearTimers = () => {
    if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    flowTimeoutRef.current = null;
    countdownRef.current = null;
  };

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const loc = lang === "en" ? "en-US" : "es-DO";
      setLiveTime(now.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
      setLiveDate(now.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lang]);

  useEffect(() => {
    if (step !== "ticket") return;
    const frame = requestAnimationFrame(() => {
      if (!qrCanvasRef.current) return;
      QRCode.toCanvas(
        qrCanvasRef.current,
        `AUTOPARK|${ticketCodeVal}|${scannedPlate}|${ticketTimeVal}|${assignedSpaceVal}`,
        { width: 84, margin: 0, color: { dark: "#0f172a", light: "#ffffff" } },
        (error: Error | null | undefined) => {
          if (error) setErrorMsg(error.message);
        },
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [step, ticketCodeVal, scannedPlate, ticketTimeVal, assignedSpaceVal]);

  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (step !== "open") return;
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setStep("initial");
          setEntryType("SIN_RESERVACION");
          return 5;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [step]);

  useEffect(() => () => clearTimers(), []);

  const openTicketThenGate = (data: {
    plate: string;
    code: string;
    space: string;
    entryTime?: string;
    rate?: number | string | null;
  }) => {
    clearTimers();
    setErrorMsg(null);
    const d = new Date(data.entryTime || Date.now());
    const valid = Number.isNaN(d.getTime()) ? new Date() : d;
    const pad = (n: number) => String(n).padStart(2, "0");

    setScannedPlate(data.plate || DEFAULT_PLATES[0]);
    setTicketTimeVal(`${pad(valid.getDate())}/${pad(valid.getMonth() + 1)}/${String(valid.getFullYear()).slice(-2)} ${pad(valid.getHours())}:${pad(valid.getMinutes())}`);
    setTicketCodeVal(data.code || `TCK-${Date.now()}`);
    setAssignedSpaceVal(data.space || "N/A");
    setTicketRateVal(data.rate ?? null);
    setStep("ticket");

    flowTimeoutRef.current = setTimeout(() => {
      setCountdown(5);
      setStep("open");
    }, 3500);
  };

  const startTicketFlow = async () => {
    clearTimers();
    setErrorMsg(null);
    setLprSubtitle(lang === "en" ? "Processing LPR image in real time…" : "Procesando imagen LPR en tiempo real…");
    setStep("lpr");

    try {
      const plates = await getValidPlates();
      const plate = plates[Math.floor(Math.random() * plates.length)] || DEFAULT_PLATES[0];
      setScannedPlate(plate);
      await wait(1000);
      setLprSubtitle(lang === "en" ? `Plate verified: ${plate}` : `¡Matrícula Verificada: ${plate}!`);

      const ticket = (await checkInTicket({ plateNumber: plate, parkingLotId: DEFAULT_LOT_ID })) as TicketExt;
      await wait(900);

      openTicketThenGate({
        plate: ticket.vehiclePlateNumber || ticket.plateNumber || plate,
        code: ticket.code,
        space: ticket.spot?.spaceNumber || ticket.spaceNumber || ticket.spotNumber || "N/A",
        entryTime: ticket.entranceAt,
        rate: ticket.rateAmount ?? ticket.rate_amount ?? ticket.rate?.amount ?? null,
      });
    } catch (err) {
      const msg = getErrMsg(err);
      console.error("[Kiosk sin reserva]", err);
      setErrorMsg(msg);
      setLprSubtitle(msg);
      flowTimeoutRef.current = setTimeout(() => setStep("initial"), 3000);
    }
  };

  const handleReservationResolved = async (res: ReservationRecord) => {
    if (reservationLoading) return;
    setReservationLoading(true);
    setErrorMsg(null);
    try {
      const plate = String(res.vehiclePlateNumber ?? res.vehicle_plate_number ?? "").trim().toUpperCase();
      const resId = Number(res.id);

      if (!res.isSubscriptionPass && Number.isInteger(resId) && resId > 0) {
        const ticket = (await checkInTicket({ reservationId: resId })) as TicketExt;
        openTicketThenGate({
          plate: ticket.vehiclePlateNumber || plate || DEFAULT_PLATES[0],
          code: ticket.code,
          space: ticket.spot?.spaceNumber || ticket.spaceNumber || "N/A",
          entryTime: ticket.entranceAt,
          rate: ticket.rateAmount ?? ticket.rate_amount ?? ticket.rate?.amount ?? null,
        });
        setReservationCode("");
        return;
      }

      const gate = await processGateEntry(
        plate || "AUTO",
        DEFAULT_LOT_ID,
        "MANUAL",
        res.qrCode ?? res.qr_code ?? reservationCode.trim(),
      );
      if (!gate) throw new Error("Sin respuesta de garita.");

      openTicketThenGate({
        plate: gate.plateNumber || plate || DEFAULT_PLATES[0],
        code: gate.ticketNumber,
        space: gate.assignedSpace || "N/A",
        entryTime: gate.entryTime,
        rate: gate.rateAmount ?? gate.rate_amount ?? null,
      });
      setReservationCode("");
    } catch (err) {
      setErrorMsg(getErrMsg(err));
      throw err;
    } finally {
      setReservationLoading(false);
    }
  };

  const triggerIntercom = () => {
    setSupportLoading(true);
    setTimeout(() => {
      setSupportLoading(false);
      setSupportConnected(true);
      setTimeout(() => setSupportConnected(false), 3000);
    }, 1200);
  };

  return (
    <div
      className="kiosk-container"
      style={{
        height: "100dvh",
        maxHeight: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "8px 20px 10px",
        boxSizing: "border-box",
      }}
    >
      <header className="kiosk-header" style={{ marginBottom: 0, padding: "6px 16px" }}>
        <div className="kiosk-header-left">
          <Title level={4} className="kiosk-title" style={{ margin: 0 }}>AUTOPARK</Title>
          <Text type="secondary" className="kiosk-subtitle">
            <EnvironmentOutlined /> Terminal Principal • Acceso Norte
          </Text>
        </div>

        <Space size={14}>
          <Button onClick={() => setLang((l) => (l === "es" ? "en" : "es"))} icon={<GlobalOutlined className="kiosk-lang-icon" />} className="kiosk-lang-btn">
            {lang.toUpperCase()} <DownOutlined className="kiosk-lang-arrow" />
          </Button>
          <div className="kiosk-clock-container">
            <div className="kiosk-clock-wrapper">
              <span className="kiosk-date-text">{liveDate}</span>
              <span className="kiosk-time-text">{liveTime}</span>
            </div>
          </div>
        </Space>
      </header>

      <div style={{ display: "flex", justifyContent: "center", margin: "6px 0 2px", flexShrink: 0 }}>
        <Segmented
          size="large"
          value={entryType}
          onChange={(val) => {
            clearTimers();
            setErrorMsg(null);
            setEntryType(val as "SIN_RESERVACION" | "CON_RESERVACION");
            setStep("initial");
          }}
          options={[
            { label: <Space size={6}><CarOutlined /><span>Sin Reserva</span></Space>, value: "SIN_RESERVACION" },
            { label: <Space size={6}><QrcodeOutlined /><span>Con Reserva</span></Space>, value: "CON_RESERVACION" },
          ]}
        />
      </div>

      <main
        className="kiosk-main"
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px 0 8px",
          overflow: "hidden",
        }}
      >
        <AreaErrorBoundary
          resetKey={`${step}-${entryType}-${ticketCodeVal}`}
          onReset={() => {
            clearTimers();
            setErrorMsg(null);
            setStep("initial");
          }}
        >
          {step === "initial" && entryType === "SIN_RESERVACION" && (
            <KioskInitial onGetTicket={startTicketFlow} dict={dict} />
          )}

          {step === "initial" && entryType === "CON_RESERVACION" && (
            <div style={{ width: "100%", maxWidth: 680, background: "#fff", borderRadius: 20, padding: "20px 24px", border: "1px solid #e2e8f0" }}>
              <ReservationQrScanner
                entryType={entryType}
                setEntryType={(val) => {
                  clearTimers();
                  setEntryType(val);
                  setStep("initial");
                }}
                reservationCode={reservationCode}
                setReservationCode={setReservationCode}
                onResolved={handleReservationResolved}
                loading={reservationLoading}
              />
            </div>
          )}

          {step === "lpr" && (
            <KioskScanner key={scannedPlate} lprSubtitle={lprSubtitle} detectedPlate={scannedPlate} dict={dict} />
          )}

          {step === "ticket" && (
            <KioskTicket
              qrCanvasRef={qrCanvasRef}
              ticketTimeVal={ticketTimeVal}
              ticketCodeVal={ticketCodeVal}
              plateNumberVal={scannedPlate}
              assignedSpaceVal={assignedSpaceVal}
              rateVal={ticketRateVal}
              dict={dict}
            />
          )}

          {step === "open" && <KioskSuccess countdown={countdown} dict={dict} />}

          {errorMsg && (
            <Text type="danger" style={{ fontSize: 12, marginTop: 6 }}>
              {errorMsg}
            </Text>
          )}
        </AreaErrorBoundary>
      </main>

      <footer className="kiosk-footer" style={{ marginTop: 0, padding: "6px 16px" }}>
        <Space size={12}>
          <div className="kiosk-footer-icon-box"><CustomerServiceOutlined /></div>
          <div>
            <Text strong className="kiosk-footer-title">{dict.needHelp}</Text>
            <Text type="secondary" className="kiosk-footer-subtitle">{dict.pressSupport}</Text>
          </div>
        </Space>

        <Button
          type="primary"
          onClick={triggerIntercom}
          icon={supportLoading ? <LoadingOutlined /> : supportConnected ? <CheckCircleOutlined className="kiosk-check-icon" /> : <PhoneOutlined />}
          className="kiosk-support-btn"
        >
          {supportConnected ? dict.connected : supportLoading ? dict.calling : dict.assistance}
        </Button>
      </footer>
    </div>
  );
}