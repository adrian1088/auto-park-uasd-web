import React, { RefObject } from "react";
import { PrinterOutlined } from "@ant-design/icons";
import { Tag, Typography } from "antd";

const { Title, Text } = Typography;

interface KioskTicketProps {
  qrCanvasRef: RefObject<HTMLCanvasElement | null>;
  ticketTimeVal: string;
  ticketCodeVal: string;
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

export default function KioskTicket({ qrCanvasRef, ticketTimeVal, ticketCodeVal, dict }: KioskTicketProps) {
  return (
    <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", alignItems: "center", margin: "0 auto" }}>
      
      {/* Cabecera de instrucciones ampliada */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <Tag color="warning" style={{ padding: "6px 18px", borderRadius: "24px", fontWeight: "bold", fontSize: "14px" }}>
          <PrinterOutlined /> {dict.printingTicket}
        </Tag>
        <Title level={4} style={{ margin: "12px 0 4px", fontSize: "22px" }}>{dict.takeTicket}</Title>
        <Text type="secondary" style={{ fontSize: "15px" }}>{dict.ticketInstruction}</Text>
      </div>

      {/* Ranura de la impresora ampliada */}
      <div style={{ width: "100%", maxWidth: "420px", backgroundColor: "#cbd5e1", padding: "10px", borderTopLeftRadius: "20px", borderTopRightRadius: "20px", borderTop: "5px solid #94a3b8", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "80%", height: "10px", backgroundColor: "#0f172a", borderRadius: "99px" }}></div>
      </div>

      {/* Tarjeta del Ticket ampliada */}
      <div style={{ 
        width: "380px", 
        backgroundColor: "#fff", 
        boxShadow: "0 30px 60px -15px rgba(0,0,0,0.3)", 
        border: "1px solid #e2e8f0", 
        borderTop: "none", 
        padding: "32px", 
        fontFamily: "monospace", 
        fontSize: "14px", 
        color: "#1e293b", 
        position: "relative" 
      }}>
        
        {/* Cabecera del recibo */}
        <div style={{ textAlign: "center", borderBottom: "2px dashed #cbd5e1", paddingBottom: "20px", marginBottom: "20px" }}>
          <span style={{ fontFamily: "sans-serif", fontSize: "22px", fontWeight: "900", letterSpacing: "-0.5px", color: "#0f172a" }}>
            AUTOPARK<span style={{ color: "#0284c7" }}>.AI</span>
          </span>
          <p style={{ fontSize: "12px", color: "#64748b", fontFamily: "sans-serif", margin: "6px 0 0" }}>{dict.parkingReceipt}</p>
        </div>

        {/* Detalles del ticket con más espacio */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94a3b8" }}>{dict.plateLabel}</span><strong style={{ color: "#0f172a", fontSize: "15px" }}>A-892-XYZ</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94a3b8" }}>{dict.dateTimeLabel}</span><span>{ticketTimeVal}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94a3b8" }}>{dict.locationLabel}</span><span>P1 • A-12</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94a3b8" }}>{dict.rateLabel}</span><span>$2.50 / hr</span></div>
        </div>

        {/* Sección del Código QR */}
        <div style={{ textAlign: "center", paddingTop: "16px", borderTop: "2px dashed #cbd5e1", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ backgroundColor: "#fff", padding: "8px", marginBottom: "8px" }}>
            <canvas ref={qrCanvasRef} aria-label="Código QR del ticket" style={{ width: "150px", height: "150px" }} />
          </div>
          <span style={{ fontSize: "12px", fontWeight: "bold", letterSpacing: "3px", color: "#64748b" }}>{ticketCodeVal}</span>
        </div>

        {/* Efecto de borde troquelado inferior */}
        <div style={{
          position: "absolute",
          bottom: "-10px",
          left: 0,
          right: 0,
          height: "10px",
          backgroundImage: "radial-gradient(circle, transparent 50%, #ffffff 50%)",
          backgroundSize: "16px 16px"
        }}></div>
      </div>
    </div>
  );
}