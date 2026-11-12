"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { ClockCircleOutlined } from "@ant-design/icons";

interface KioskSuccessProps {
  countdown: number;
  dict: {
    barrierOpenTitle: string;
    driveCarefully: string;
    closingIn: string;
  };
  imageUrl?: string;
}

export default function KioskSuccess({ countdown, dict, imageUrl }: KioskSuccessProps) {
  const defaultImage = "https://st5.depositphotos.com/8742624/62700/v/450/depositphotos_627005704-stock-illustration-car-parking-security-barrier-gate.jpg";

  useEffect(() => {
    const originalBackground = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#ffffff";

    return () => {
      document.body.style.backgroundColor = originalBackground;
    };
  }, []);

  return (
    <div style={{
      position: "relative",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      paddingTop: "20px",
      backgroundColor: "#ffffff"
    }}>
      {}
      <div style={{
        position: "absolute",
        left: "30px",
        top: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "400px",
        height: "300px"
      }}>
        <Image 
          src={imageUrl || defaultImage} 
          alt="Barrera de estacionamiento" 
          fill
          style={{ objectFit: "contain" }}
          unoptimized={true} 
        />
      </div>

      {/* Contenedor principal ampliado (centrado) */}
      <div style={{ 
        width: "100%", 
        maxWidth: "880px", 
        backgroundColor: "#050b14", 
        borderRadius: "13px", 
        padding: "64px 56px", 
        boxShadow: "0 25px 60px -15px rgba(16, 185, 129, 0.25)", 
        textAlign: "center", 
        position: "relative", 
        overflow: "hidden",
        color: "#ffffff"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "10px", backgroundColor: "#10b981", boxShadow: "0 0 30px #10b981, 0 0 60px rgba(16,185,129,0.5)" }}></div>

        {/* Badge superior */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", backgroundColor: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", padding: "10px 28px", borderRadius: "99px", marginBottom: "28px" }}>
          <span style={{ fontSize: "14px", fontWeight: "900", letterSpacing: "3px", color: "#34d399", textTransform: "uppercase" }}>ACCESO AUTORIZADO</span>
        </div>

        {/* Título grande */}
        <h2 style={{ fontSize: "48px", fontWeight: "900", letterSpacing: "-0.5px", color: "#ffffff", margin: "0 0 16px" }}>
          {dict.barrierOpenTitle}
        </h2>
        
        {/* Descripción grande */}
        <p style={{ fontSize: "18px", fontWeight: "600", color: "#94a3b8", marginBottom: "44px", letterSpacing: "0.5px" }}>
          {dict.driveCarefully}
        </p>

        {/* Caja de tiempo límite inferior */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgb(245, 246, 248)", border: "1px solid #1e293b", padding: "26px 36px", borderRadius: "24px", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ width: "54px", height: "54px", borderRadius: "16px", backgroundColor: "rgba(56, 189, 248, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClockCircleOutlined style={{ color: "#020202", fontSize: "26px" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <span style={{ fontSize: "13px", color: "#050505", display: "block", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{dict.closingIn}</span>
              <span style={{ fontSize: "16px", color: "#7d7c7c", fontWeight: 500 }}>Barrera automática temporizada</span>
            </div>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "32px", fontWeight: "900",  backgroundColor: "#010101", color: "#ffffff", padding: "10px 22px", borderRadius: "14px" }}>
            0{countdown}s
          </div>
        </div>
      </div>
    </div>
  );
}