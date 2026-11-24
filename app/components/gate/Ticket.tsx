import React, { RefObject } from "react";
import { PrinterOutlined } from "@ant-design/icons";
import { Tag, Typography } from "antd";

const { Title, Text } = Typography;

interface KioskTicketProps {
  qrCanvasRef: RefObject<HTMLCanvasElement | null>;
  ticketTimeVal: string;
  ticketCodeVal: string;
  plateNumberVal?: string;
  assignedSpaceVal?: string;
  rateVal?: string | number | null;
  dict: {
    printingTicket: string;
    takeTicket: string;
    ticketInstruction: string;
    parkingReceipt: string;
    plateLabel: string;
    dateTimeLabel: string;
    locationLabel: string;
    rateLabel: string;
  };
}

function formatRateLabel(rateVal?: string | number | null): string {
  if (rateVal === undefined || rateVal === null || String(rateVal).trim() === "") {
    return "N/A";
  }

  const numeric =
    typeof rateVal === "number"
      ? rateVal
      : Number(String(rateVal).trim());

  if (Number.isFinite(numeric)) {
    return `RD$${numeric.toFixed(2)} / hr`;
  }

  return String(rateVal).trim();
}

export default function KioskTicket({
  qrCanvasRef,
  ticketTimeVal,
  plateNumberVal = "N/A",
  assignedSpaceVal = "N/A",
  rateVal,
  dict,
}: KioskTicketProps) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "420px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "0 auto",
      }}
    >
      {/* Encabezado */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <Tag
          color="warning"
          style={{
            padding: "3px 12px",
            borderRadius: "10px",
            fontWeight: "bold",
            fontSize: "11.5px",
            lineHeight: "19px",
          }}
        >
          <PrinterOutlined /> {dict.printingTicket}
        </Tag>

        <Title
          level={5}
          style={{
            margin: "5px 0 2px",
            fontSize: "17px",
            lineHeight: 1.2,
          }}
        >
          {dict.takeTicket}
        </Title>

        <Text
          type="secondary"
          style={{
            fontSize: "12.5px",
            lineHeight: 1.35,
            display: "block",
          }}
        >
          {dict.ticketInstruction}
        </Text>
      </div>

      {/* Parte superior de la impresora */}
      <div
        style={{
          width: "370px",
          maxWidth: "100%",
          boxSizing: "border-box",
          backgroundColor: "#cbd5e1",
          padding: "4px",
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
          borderTop: "3px solid #94a3b8",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "58%",
            height: "5px",
            backgroundColor: "#0f172a",
            borderRadius: "99px",
          }}
        />
      </div>

      {/* Papel del ticket */}
      <div
        style={{
          width: "356px",
          maxWidth: "100%",
          boxSizing: "border-box",
          backgroundColor: "#fff",
          boxShadow: "0 10px 24px -6px rgba(0,0,0,0.18)",
          border: "1px solid #e2e8f0",
          borderTop: "none",
          padding: "13px 20px 14px",
          fontFamily: "monospace",
          fontSize: "12.5px",
          color: "#1e293b",
          position: "relative",
        }}
      >
        {/* Identidad del ticket */}
        <div
          style={{
            textAlign: "center",
            borderBottom: "1px dashed #cbd5e1",
            paddingBottom: "8px",
            marginBottom: "10px",
          }}
        >
          <span
            style={{
              fontFamily: "sans-serif",
              fontSize: "19px",
              fontWeight: 900,
              letterSpacing: "-0.6px",
              color: "#0f172a",
            }}
          >
            AUTOPARK<span style={{ color: "#0284c7" }}>.AI</span>
          </span>

          <p
            style={{
              fontSize: "11.5px",
              color: "#64748b",
              fontFamily: "sans-serif",
              margin: "2px 0 0",
            }}
          >
            {dict.parkingReceipt}
          </p>
        </div>

        {/* Información del vehículo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "11px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#94a3b8" }}>
              {dict.plateLabel}
            </span>

            <strong style={{ color: "#0f172a", fontSize: "13px", textAlign: "right" }}>
              {plateNumberVal || "N/A"}
            </strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#94a3b8" }}>
              {dict.dateTimeLabel}
            </span>

            <span style={{ textAlign: "right" }}>
              {ticketTimeVal}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#94a3b8" }}>
              {dict.locationLabel}
            </span>

            <span style={{ textAlign: "right" }}>
              {assignedSpaceVal || "N/A"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#94a3b8" }}>
              {dict.rateLabel}
            </span>

            <span style={{ textAlign: "right" }}>
              {formatRateLabel(rateVal)}
            </span>
          </div>
        </div>

        {/* Código QR */}
        <div
          style={{
            textAlign: "center",
            paddingTop: "10px",
            borderTop: "1px dashed #cbd5e1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "3px",
              border: "1px solid #f1f5f9",
              borderRadius: "6px",
            }}
          >
            <canvas
              ref={qrCanvasRef}
              aria-label="Código QR del ticket"
              style={{
                width: "84px",
                height: "84px",
                display: "block",
              }}
            />
          </div>
        </div>

        {/* Terminación del papel */}
        <div
          style={{
            position: "absolute",
            bottom: "-6px",
            left: 0,
            right: 0,
            height: "6px",
            backgroundImage:
              "radial-gradient(circle, transparent 50%, #ffffff 50%)",
            backgroundSize: "10px 10px",
          }}
        />
      </div>
    </div>
  );
}