import React from "react";
import { Button } from "antd";
import { BarcodeOutlined, InfoCircleOutlined } from "@ant-design/icons";

interface KioskInitialProps {
  onGetTicket: () => void;
  dict: {
    getTicket: string;
    pressTicket: string;
    approachVehicle: string;
  };
}

export default function KioskInitial({ onGetTicket, dict }: KioskInitialProps) {
  return (
    <div style={{
      width: "100%", maxWidth: 1220, background: "#fff",
      borderRadius: 28, padding: 50,
      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.08)",
      border: "1px solid #e2e8f0", textAlign: "center",
      position: "relative"
    }}>
      <div style={{
        position: "absolute", inset: "0 0 auto", height: 9,
        background: "linear-gradient(to right, #0ea5e9, #0ea5e9)",
        borderRadius: "28px 28px 0 0"
      }} />

      <Button
        block
        onClick={onGetTicket}
        style={{
          height: "auto", whiteSpace: "normal",
          background: "#0f172a", color: "#fff",
          border: "1px solid rgba(56,189,248,0.4)",
          borderRadius: 20, padding: "100px 20px",
          boxShadow: "0 12px 20px -4px rgba(2,132,199,0.35)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center"
        }}
      >
        <span style={{
          width: 122, height: 122, borderRadius: 18,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center",
          justifyContent: "center", marginBottom: 18,
          fontSize: 76
        }}>
          <BarcodeOutlined />
        </span>

        <span style={{
          fontSize: 45, fontWeight: 900,
          letterSpacing: "-0.5px", marginBottom: 6
        }}>
          {dict.getTicket}
        </span>

        <span style={{
          fontSize: 17, fontWeight: 700,
          letterSpacing: "1.2px", textTransform: "uppercase",
          color: "#e0f2fe"
        }}>
          {dict.pressTicket}
        </span>
      </Button>

      <p style={{
        fontSize: 16, color: "#64748b", marginTop: 24,
        display: "flex", alignItems: "center",
        justifyContent: "center", gap: 6
      }}>
        <InfoCircleOutlined />
        {dict.approachVehicle}
      </p>
    </div>
  );
}
