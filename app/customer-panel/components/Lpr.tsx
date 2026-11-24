"use client";

import React, { useState, useEffect } from "react";
import { CameraOutlined, ScanOutlined } from "@ant-design/icons";
import { Space, Typography } from "antd";

const { Text } = Typography;

interface LprScannerProps {
  lprSubtitle: string;
  detectedPlate?: string;
  dict: {
    plateRecognition: string;
    scanning: string;
  };
}

export default function LprScanner({
  lprSubtitle,
  detectedPlate = "A-312-XYZ",
  dict,
}: LprScannerProps) {
  const [showPlate, setShowPlate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPlate(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "820px",
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "22px 28px",
        boxShadow: "0 18px 36px -12px rgba(0,0,0,0.1)",
        border: "1px solid #e2e8f0",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* Cabecera del Módulo LPR */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
          gap: "12px",
        }}
      >
        <Space size={10}>
          <div style={{ color: "#0284c7", fontSize: "22px", display: "flex", alignItems: "center" }}>
            <CameraOutlined />
          </div>
          <Text style={{ color: "#0f172a", fontSize: "17px", fontWeight: 900, letterSpacing: "-0.3px" }}>
            {dict.plateRecognition}
          </Text>
        </Space>

        <Text type="secondary" style={{ fontSize: "13.5px", fontWeight: 600 }}>
          {showPlate ? `¡Matrícula detectada: ${detectedPlate}!` : lprSubtitle}
        </Text>
      </div>

      {/* Contenedor de la Cámara LPR */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "270px",
          backgroundColor: "#060a14",
          borderRadius: "18px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #1e293b",
          boxShadow: "inset 0 0 32px rgba(0,0,0,0.8)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(56, 189, 248, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Esquinas de enfoque */}
        <div style={{ position: "absolute", top: "20px", left: "24px", width: "24px", height: "24px", borderTop: "3px solid #38bdf8", borderLeft: "3px solid #38bdf8" }} />
        <div style={{ position: "absolute", top: "20px", right: "24px", width: "24px", height: "24px", borderTop: "3px solid #38bdf8", borderRight: "3px solid #38bdf8" }} />
        <div style={{ position: "absolute", bottom: "20px", left: "24px", width: "24px", height: "24px", borderBottom: "3px solid #38bdf8", borderLeft: "3px solid #38bdf8" }} />
        <div style={{ position: "absolute", bottom: "20px", right: "24px", width: "24px", height: "24px", borderBottom: "3px solid #38bdf8", borderRight: "3px solid #38bdf8" }} />

        {/* Marco interno LPR */}
        <div
          style={{
            position: "absolute",
            top: "14px",
            bottom: "14px",
            left: "18px",
            right: "18px",
            border: "1px solid rgba(56, 189, 248, 0.15)",
            borderRadius: "12px",
            pointerEvents: "none",
          }}
        />

        {!showPlate ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "rgba(15, 23, 42, 0.92)",
              padding: "12px 22px",
              borderRadius: "14px",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.6)",
              zIndex: 10,
              animation: "strongBounce 1.2s ease-in-out infinite",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(56, 189, 248, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8",
                fontSize: "20px",
              }}
            >
              <ScanOutlined className="animate-spin" />
            </div>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "15px",
                fontWeight: 900,
                letterSpacing: "2.5px",
                color: "#38bdf8",
              }}
            >
              {dict.scanning}
            </span>
          </div>
        ) : (
          <div
            style={{
              zIndex: 10,
              textAlign: "center",
              animation: "fadeInScale 0.35s ease-out forwards",
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "52px",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "5px",
                textShadow: "0 0 24px rgba(56, 189, 248, 0.7), 0 6px 14px rgba(0,0,0,0.9)",
              }}
            >
              {detectedPlate}
            </span>
          </div>
        )}

        {/* Barra láser */}
        <div
          style={{
            position: "absolute",
            left: "20px",
            right: "20px",
            height: "4px",
            backgroundColor: "#38bdf8",
            boxShadow: "0 0 24px 6px #38bdf8, 0 0 48px 14px rgba(56,189,248,0.45)",
            zIndex: 20,
            animation: "laserScanBounce 2s ease-in-out infinite alternate",
          }}
        />

        <style>{`
          @keyframes laserScanBounce {
            0% { bottom: 20px; opacity: 0.4; }
            50% { opacity: 1; }
            100% { bottom: 225px; opacity: 0.4; }
          }
          @keyframes strongBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes fadeInScale {
            0% { opacity: 0; transform: scale(0.92); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}