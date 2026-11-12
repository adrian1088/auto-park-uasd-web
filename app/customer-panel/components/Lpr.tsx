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
  detectedPlate = "A-892-XYZ", 
  dict 
}: LprScannerProps) {
  const [showPlate, setShowPlate] = useState(false);

  // Simula el tiempo de lectura de la cámara LPR antes de revelar la matrícula detectada
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPlate(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ 
      width: "100%", 
      maxWidth: "880px", 
      backgroundColor: "#ffffff", 
      borderRadius: "32px", 
      padding: "40px", 
      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)", 
      border: "1px solid #e2e8f0",
      margin: "0 auto"
    }}>
      
      {/* Cabecera del Módulo LPR */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <Space size={14}>
          <div style={{ color: "#0284c7", fontSize: "26px", display: "flex", alignItems: "center" }}>
            <CameraOutlined />
          </div>
          <Text style={{ color: "#0f172a", fontSize: "20px", fontWeight: 900, letterSpacing: "-0.3px" }}>
            {dict.plateRecognition}
          </Text>
        </Space>
        
        <Text type="secondary" style={{ fontSize: "15px", fontWeight: 600 }}>
          {showPlate ? `¡Matrícula detectada: ${detectedPlate}!` : lprSubtitle}
        </Text>
      </div>
      
      {/* Contenedor de la Cámara LPR con animación y efecto de rayo láser */}
      <div style={{ 
        position: "relative", 
        width: "100%", 
        height: "400px", 
        backgroundColor: "#060a14", 
        borderRadius: "24px", 
        overflow: "hidden", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        border: "1px solid #1e293b", 
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.8)" 
      }}>
        
        {/* Fondo de la cámara con efecto de cuadrícula */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(to right, rgba(56, 189, 248, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.04) 1px, transparent 1px)",
          backgroundSize: "36px 36px"
        }}></div>

        {/* Esquinas de enfoque de la cámara */}
        <div style={{ position: "absolute", top: "32px", left: "36px", width: "32px", height: "32px", borderTop: "3px solid #38bdf8", borderLeft: "3px solid #38bdf8" }}></div>
        <div style={{ position: "absolute", top: "32px", right: "36px", width: "32px", height: "32px", borderTop: "3px solid #38bdf8", borderRight: "3px solid #38bdf8" }}></div>
        <div style={{ position: "absolute", bottom: "32px", left: "36px", width: "32px", height: "32px", borderBottom: "3px solid #38bdf8", borderLeft: "3px solid #38bdf8" }}></div>
        <div style={{ position: "absolute", bottom: "32px", right: "36px", width: "32px", height: "32px", borderBottom: "3px solid #38bdf8", borderRight: "3px solid #38bdf8" }}></div>

        {/* Marco interno LPR */}
        <div style={{ position: "absolute", top: "24px", bottom: "24px", left: "28px", right: "28px", border: "1px solid rgba(56, 189, 248, 0.15)", borderRadius: "16px", pointerEvents: "none" }}></div>

        {!showPlate ? (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "16px", 
            backgroundColor: "rgba(15, 23, 42, 0.9)", 
            padding: "16px 28px", 
            borderRadius: "18px", 
            border: "1px solid rgba(56, 189, 248, 0.4)",
            boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
            zIndex: 10,
            animation: "strongBounce 1.2s ease-in-out infinite"
          }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "12px", backgroundColor: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8", fontSize: "24px" }}>
              <ScanOutlined className="animate-spin" />
            </div>
            <span style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: "900", letterSpacing: "3px", color: "#38bdf8" }}>
              LEYENDO PLACA LPR...
            </span>
          </div>
        ) : (
          <div style={{ 
            zIndex: 10, 
            textAlign: "center",
            animation: "fadeInScale 0.4s ease-out forwards"
          }}>
            <span style={{ 
              fontFamily: "monospace", 
              fontSize: "64px", 
              fontWeight: "900", 
              color: "#ffffff", 
              letterSpacing: "6px",
              textShadow: "0 0 30px rgba(56, 189, 248, 0.7), 0 6px 15px rgba(0,0,0,0.9)"
            }}>
              {detectedPlate}
            </span>
          </div>
        )}

        {/* Barra láser de escaneo LPR con movimiento fluido */}
        <div style={{
          position: "absolute",
          left: "28px",
          right: "28px",
          height: "5px",
          backgroundColor: "#38bdf8",
          boxShadow: "0 0 30px 8px #38bdf8, 0 0 60px 20px rgba(56,189,248,0.5)",
          zIndex: 20,
          animation: "laserScanBounce 2s ease-in-out infinite alternate"
        }}></div>

        {/* Animaciones CSS embebidas */}
        <style>{`
          @keyframes laserScanBounce {
            0% { bottom: 30px; opacity: 0.4; }
            50% { opacity: 1; }
            100% { bottom: 350px; opacity: 0.4; }
          }
          @keyframes strongBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-14px); }
          }
          @keyframes fadeInScale {
            0% { opacity: 0; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}