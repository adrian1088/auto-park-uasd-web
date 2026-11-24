"use client";

import React, { useEffect } from "react";
import { ClockCircleOutlined } from "@ant-design/icons";

export interface SuccessProps {
  countdown: number;
  dict: {
    barrierOpenTitle: string;
    driveCarefully: string;
    closingIn: string;
  };
  imageUrl?: string;
}

export default function Success({ countdown, dict }: SuccessProps) {
  useEffect(() => {
    const originalBackground = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#ffffff";

    return () => {
      document.body.style.backgroundColor = originalBackground;
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxHeight: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "8px 16px",
        backgroundColor: "#ffffff",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "820px",
          backgroundColor: "#050b14",
          borderRadius: "13px",
          padding: "36px 40px",
          boxShadow: "0 20px 45px -15px rgba(16, 185, 129, 0.25)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          color: "#ffffff",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            backgroundColor: "#10b981",
            boxShadow: "0 0 24px #10b981, 0 0 48px rgba(16,185,129,0.45)",
          }}
        />

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            padding: "8px 22px",
            borderRadius: "99px",
            marginBottom: "18px",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: "900",
              letterSpacing: "2.5px",
              color: "#34d399",
              textTransform: "uppercase",
            }}
          >
            ACCESO AUTORIZADO
          </span>
        </div>

        <h2
          style={{
            fontSize: "38px",
            fontWeight: "900",
            letterSpacing: "-0.5px",
            color: "#ffffff",
            margin: "0 0 10px",
            lineHeight: 1.15,
          }}
        >
          {dict.barrierOpenTitle}
        </h2>

        <p
          style={{
            fontSize: "15px",
            fontWeight: "600",
            color: "#94a3b8",
            marginBottom: "24px",
            letterSpacing: "0.4px",
          }}
        >
          {dict.driveCarefully}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "rgb(245, 246, 248)",
            border: "1px solid #1e293b",
            padding: "18px 26px",
            borderRadius: "20px",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "14px",
                backgroundColor: "rgba(56, 189, 248, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ClockCircleOutlined style={{ color: "#020202", fontSize: "22px" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <span
                style={{
                  fontSize: "12px",
                  color: "#050505",
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontWeight: 700,
                }}
              >
                {dict.closingIn}
              </span>
              <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>
                Barrera automática temporizada
              </span>
            </div>
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "28px",
              fontWeight: "900",
              backgroundColor: "#010101",
              color: "#ffffff",
              padding: "8px 18px",
              borderRadius: "12px",
            }}
          >
            0{countdown}s
          </div>
        </div>
      </div>
    </div>
  );
}