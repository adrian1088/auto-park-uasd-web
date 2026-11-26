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
    <div
      style={{
        width: "100%",
        maxWidth: 1120,
        background: "#fff",
        borderRadius: 22,
        padding: "24px 32px 18px",
        boxShadow: "0 14px 24px -6px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0",
        textAlign: "center",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0 0 auto",
          height: 7,
          background: "#0ea5e9",
          borderRadius: "22px 22px 0 0",
        }}
      />

      <Button
        block
        onClick={onGetTicket}
        style={{
          height: "auto",
          whiteSpace: "normal",
          background: "#0f172a",
          color: "#fff",
          border: "1px solid rgba(56,189,248,0.4)",
          borderRadius: 18,
          padding: "46px 20px",
          boxShadow: "0 12px 20px -4px rgba(2,132,199,0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            width: 88,
            height: 88,
            borderRadius: 16,
            background: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
            fontSize: 54,
          }}
        >
          <BarcodeOutlined />
        </span>

        <span
          style={{
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: "-0.5px",
            marginBottom: 4,
            lineHeight: 1.15,
          }}
        >
          {dict.getTicket}
        </span>

        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "1.1px",
            textTransform: "uppercase",
            color: "#e0f2fe",
          }}
        >
          {dict.pressTicket}
        </span>
      </Button>

      <p
        style={{
          fontSize: 14,
          color: "#64748b",
          margin: "12px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <InfoCircleOutlined />
        {dict.approachVehicle}
      </p>
    </div>
  );
}