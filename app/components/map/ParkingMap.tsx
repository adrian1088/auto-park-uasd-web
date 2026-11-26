"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import { Card, Typography, Tag, Spin, Tooltip, Select, Space } from "antd";
import { EnvironmentOutlined, CheckCircleFilled, CarFilled, CloseCircleFilled, TagFilled } from "@ant-design/icons";
import { http } from "@/app/lib/http";
import type { ApiResponseList } from "@/app/lib/api/base";
import { getParkingLots, type ParkingLot } from "@/app/lib/api/lots";
import { getParkingSpaces, type ParkingSpace } from "@/app/lib/api/spaces";
import type { ParkingFloor } from "@/app/lib/api/floors";

const { Text } = Typography;

interface ParkingMapProps {
  refreshTrigger: number;
}

export default function ParkingMap({ refreshTrigger }: ParkingMapProps) {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [floors, setFloors] = useState<ParkingFloor[]>([]);
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);

  const [selectedLotId, setSelectedLotId] = useState<string | number | undefined>(undefined);
  const [selectedFloorId, setSelectedFloorId] = useState<string | number | undefined>(undefined);

  const [loading, startTransition] = useTransition();

  const fetchLots = useCallback(async () => {
    try {
      const lotsList = await getParkingLots();
      const safeLots = Array.isArray(lotsList) ? lotsList : [];
      setLots(safeLots);
      if (safeLots.length > 0) {
        setSelectedLotId((prev) => {
          const exists = safeLots.some((l) => String(l.id) === String(prev));
          return exists ? prev : safeLots[0].id;
        });
      }
    } catch (error) {
      console.error("Error al cargar los lotes:", error);
    }
  }, []);

  const fetchFloors = useCallback(async (lotId: string | number) => {
    try {
      const response = await http.get<ApiResponseList<ParkingFloor>>(
        "/parking/floors",
        { query: { lotId } },
      );
      const floorsList = Array.isArray(response?.data) ? response.data : [];
      setFloors(floorsList);
      if (floorsList.length > 0) {
        setSelectedFloorId(floorsList[0].id);
      } else {
        setSelectedFloorId(undefined);
      }
    } catch (error) {
      console.error("Error al cargar los pisos:", error);
    }
  }, []);

  const fetchSpaces = useCallback(async (lotId: string | number, floorId?: string | number) => {
    try {
      const spacesList = await getParkingSpaces(
        Number(lotId),
        floorId !== undefined ? Number(floorId) : undefined,
      );
      setSpaces(Array.isArray(spacesList) ? spacesList : []);
    } catch (error) {
      console.error("Error al cargar los espacios:", error);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      fetchLots();
    });
  }, [fetchLots]);

  useEffect(() => {
    if (selectedLotId !== undefined) {
      startTransition(() => {
        fetchFloors(selectedLotId);
      });
    }
  }, [selectedLotId, fetchFloors]);

  useEffect(() => {
    if (selectedLotId !== undefined) {
      startTransition(() => {
        fetchSpaces(selectedLotId, selectedFloorId);
      });
    }
  }, [selectedLotId, selectedFloorId, refreshTrigger, fetchSpaces]);

  const freeCount = spaces.filter((s) => String(s.status || "").trim().toUpperCase() === "FREE").length;
  const reservedCount = spaces.filter((s) => String(s.status || "").trim().toUpperCase() === "RESERVED").length;
  const totalCount = spaces.length;

  return (
    <Card
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <span><EnvironmentOutlined style={{ color: "#0284c7" }} /> Mapa de Estacionamiento</span>
          <Space>
            <Tag color={freeCount > 0 ? "success" : "error"} style={{ fontSize: "13px", padding: "2px 8px" }}>
              Libres: {freeCount} / {totalCount}
            </Tag>
            {reservedCount > 0 && (
              <Tag color="processing" style={{ fontSize: "13px", padding: "2px 8px" }}>
                Cupo Reserva: {reservedCount}
              </Tag>
            )}
          </Space>
        </div>
      }
      style={{ borderRadius: "12px", border: "1px solid #e2e8f0", height: "100%" }}
      styles={{ body: { padding: "16px" } }}
    >
      <Space orientation="vertical" style={{ width: "100%", marginBottom: "14px" }} size={8}>
        <div style={{ display: "flex", gap: "8px" }}>
          <Select
            style={{ width: "60%" }}
            placeholder="Seleccionar Lote"
            value={selectedLotId}
            onChange={(value) => setSelectedLotId(value)}
            options={lots.map((l) => ({ label: l.name, value: l.id }))}
          />
          <Select
            style={{ width: "40%" }}
            placeholder="Seleccionar Piso"
            value={selectedFloorId}
            onChange={(value) => setSelectedFloorId(value)}
            options={floors.map((f) => ({ label: `Piso ${f.floorNumber}`, value: f.id }))}
            disabled={floors.length === 0}
          />
        </div>
      </Space>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin description="Cargando espacios del nivel..." />
        </div>
      ) : spaces.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
          <Text type="secondary">No hay espacios registrados para esta selección.</Text>
        </div>
      ) : (
        <div style={{ 
          backgroundColor: "#f8fafc", 
          borderRadius: "10px", 
          padding: "16px", 
          border: "1px solid #e2e8f0",
          maxHeight: "300px",
          overflowY: "auto"
        }}>
          {/* Leyenda Actualizada */}
          <div style={{ marginBottom: "12px", display: "flex", gap: "12px", fontSize: "11px", justifyContent: "center", flexWrap: "wrap" }}>
            <span><span style={{ color: "#22c55e", fontWeight: "bold" }}>■</span> Libre</span>
            <span><span style={{ color: "#0284c7", fontWeight: "bold" }}>■</span> Exclusivo Reserva</span>
            <span><span style={{ color: "#64748b", fontWeight: "bold" }}>■</span> Ocupado</span>
            <span><span style={{ color: "#ef4444", fontWeight: "bold" }}>■</span> Fuera de servicio</span>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", 
            gap: "10px" 
          }}>
            {spaces.map((space) => {
              const status = String(space.status || "").trim().toUpperCase();
              const isOccupied = status === "OCCUPIED";
              const isFree = status === "FREE";
              const isReserved = status === "RESERVED";
              const isOutOfService = !isOccupied && !isFree && !isReserved;

              let bgColor = "#ffffff";
              let borderColor = "#22c55e";
              let textColor = "#0f172a";

              if (isOccupied) {
                bgColor = "#e2e8f0";
                borderColor = "#94a3b8";
                textColor = "#475569";
              } else if (isReserved) {
                bgColor = "#e0f2fe";
                borderColor = "#0284c7";
                textColor = "#0369a1";
              } else if (isOutOfService) {
                bgColor = "#fee2e2";
                borderColor = "#ef4444";
                textColor = "#991b1b";
              }

              return (
                <Tooltip key={space.id} title={`Espacio: ${space.spaceNumber} | Estado: ${space.status}`}>
                  <div style={{
                    backgroundColor: bgColor,
                    border: `2px solid ${borderColor}`,
                    borderRadius: "10px",
                    padding: "8px 4px",
                    textAlign: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: "65px"
                  }}>
                    <Text strong style={{ fontSize: "13px", color: textColor }}>
                      {space.spaceNumber}
                    </Text>

                    <div style={{ margin: "2px 0" }}>
                      {isOccupied && <CarFilled style={{ fontSize: "20px", color: "#475569" }} />}
                      {isFree && <CheckCircleFilled style={{ fontSize: "18px", color: "#22c55e" }} />}
                      {isReserved && <TagFilled style={{ fontSize: "18px", color: "#0284c7" }} />}
                      {isOutOfService && <CloseCircleFilled style={{ fontSize: "16px", color: "#ef4444" }} />}
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}