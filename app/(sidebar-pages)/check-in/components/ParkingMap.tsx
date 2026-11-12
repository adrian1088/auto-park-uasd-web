"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import { Card, Typography, Tag, Spin, Tooltip, Select, Space } from "antd";
import { EnvironmentOutlined, CheckCircleFilled, CarFilled, CloseCircleFilled, TagFilled } from "@ant-design/icons";

const { Text } = Typography;

interface ParkingLot {
  id: string | number;
  name: string;
}

interface ParkingFloor {
  id: string | number;
  floorNumber: number;
}

interface ParkingSpaceItem {
  id: string | number;
  spaceNumber: string;
  type: string;
  status: string;
  floor?: {
    id: string | number;
    floorNumber: number;
    lot?: {
      id: string | number;
      name: string;
    };
  };
}

interface ParkingMapProps {
  refreshTrigger: number;
}

export default function ParkingMap({ refreshTrigger }: ParkingMapProps) {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [floors, setFloors] = useState<ParkingFloor[]>([]);
  const [spaces, setSpaces] = useState<ParkingSpaceItem[]>([]);

  const [selectedLotId, setSelectedLotId] = useState<string | number>(1);
  const [selectedFloorId, setSelectedFloorId] = useState<string | number | undefined>(undefined);

  const [loading, startTransition] = useTransition();

  const fetchLots = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3001/api/v1/parking/lots", {
        credentials: "include",
      });
      if (res.ok) {
        const result = await res.json();
        const lotsList = Array.isArray(result) ? result : result?.data || [];
        setLots(lotsList);
      }
    } catch (error) {
      console.error("Error al cargar los lotes:", error);
    }
  }, []);

  const fetchFloors = useCallback(async (lotId: string | number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/v1/parking/floors?lotId=${lotId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const result = await res.json();
        const floorsList = Array.isArray(result) ? result : result?.data || [];
        setFloors(floorsList);
        if (floorsList.length > 0) {
          setSelectedFloorId(floorsList[0].id);
        } else {
          setSelectedFloorId(undefined);
        }
      }
    } catch (error) {
      console.error("Error al cargar los pisos:", error);
    }
  }, []);

  const fetchSpaces = useCallback(async (lotId: string | number, floorId?: string | number) => {
    try {
      let url = `http://localhost:3001/api/v1/parking/spaces?lotId=${lotId}`;
      if (floorId) {
        url += `&floorId=${floorId}`;
      }
      const res = await fetch(url, {
        credentials: "include",
      });
      if (res.ok) {
        const result = await res.json();
        const spacesList: ParkingSpaceItem[] = Array.isArray(result) ? result : result?.data || [];
        setSpaces(spacesList);
      }
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
    if (selectedLotId) {
      startTransition(() => {
        fetchFloors(selectedLotId);
      });
    }
  }, [selectedLotId, fetchFloors]);

  useEffect(() => {
    if (selectedLotId) {
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