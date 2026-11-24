"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import {
  Card,
  Flex,
  Progress,
  Segmented,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  BarChartOutlined,
  CarFilled,
  CheckCircleFilled,
  CloseCircleFilled,
  EnvironmentOutlined,
  TagFilled,
} from "@ant-design/icons";

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

export interface ParkingMapCardProps {
  refreshTrigger: number;
}

export function ParkingMapCard({ refreshTrigger }: ParkingMapCardProps) {
  const [viewMode, setViewMode] = useState<"MAP" | "CHART">("MAP");

  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [floors, setFloors] = useState<ParkingFloor[]>([]);
  const [spaces, setSpaces] = useState<ParkingSpaceItem[]>([]);

  const [selectedLotId, setSelectedLotId] = useState<string | number>(1);
  const [selectedFloorId, setSelectedFloorId] = useState<
    string | number | undefined
  >(undefined);

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
      const res = await fetch(
        `http://localhost:3001/api/v1/parking/floors?lotId=${lotId}`,
        { credentials: "include" },
      );
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

  const fetchSpaces = useCallback(
    async (lotId: string | number, floorId?: string | number) => {
      try {
        let url = `http://localhost:3001/api/v1/parking/spaces?lotId=${lotId}`;
        if (floorId) {
          url += `&floorId=${floorId}`;
        }
        const res = await fetch(url, { credentials: "include" });
        if (res.ok) {
          const result = await res.json();
          const spacesList: ParkingSpaceItem[] = Array.isArray(result)
            ? result
            : result?.data || [];
          setSpaces(spacesList);
        }
      } catch (error) {
        console.error("Error al cargar los espacios:", error);
      }
    },
    [],
  );

  useEffect(() => {
    startTransition(() => {
      void fetchLots();
    });
  }, [fetchLots]);

  useEffect(() => {
    if (selectedLotId) {
      startTransition(() => {
        void fetchFloors(selectedLotId);
      });
    }
  }, [selectedLotId, fetchFloors]);

  useEffect(() => {
    if (selectedLotId) {
      startTransition(() => {
        void fetchSpaces(selectedLotId, selectedFloorId);
      });
    }
  }, [selectedLotId, selectedFloorId, refreshTrigger, fetchSpaces]);

  const freeCount = spaces.filter(
    (s) => String(s.status || "").trim().toUpperCase() === "FREE",
  ).length;
  const occupiedCount = spaces.filter(
    (s) => String(s.status || "").trim().toUpperCase() === "OCCUPIED",
  ).length;
  const reservedCount = spaces.filter(
    (s) => String(s.status || "").trim().toUpperCase() === "RESERVED",
  ).length;
  const outOfServiceCount = spaces.filter((s) => {
    const st = String(s.status || "").trim().toUpperCase();
    return st !== "FREE" && st !== "OCCUPIED" && st !== "RESERVED";
  }).length;
  const totalCount = spaces.length;

  const statsItems = [
    { label: "Libres", count: freeCount, color: "#22c55e" },
    { label: "Ocupados", count: occupiedCount, color: "#64748b" },
    { label: "Exclusivo Reserva", count: reservedCount, color: "#0284c7" },
    { label: "Fuera de servicio", count: outOfServiceCount, color: "#ef4444" },
  ];

  return (
    <Card
      size="small"
      style={{
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
      }}
      styles={{ body: { padding: "12px 14px" } }}
      title={
        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
          <Space size={6}>
            <EnvironmentOutlined style={{ color: "#0284c7", fontSize: 14 }} />
            <Text strong style={{ fontSize: 13 }}>
              Estacionamiento
            </Text>
          </Space>

          <Flex align="center" gap={8} wrap="wrap">
            <Tag
              color={freeCount > 0 ? "success" : "error"}
              style={{ fontSize: 11, margin: 0 }}
            >
              Libres: {freeCount} / {totalCount}
            </Tag>
            {reservedCount > 0 && (
              <Tag color="processing" style={{ fontSize: 11, margin: 0 }}>
                Reserva: {reservedCount}
              </Tag>
            )}
            <Segmented
              size="small"
              value={viewMode}
              onChange={(val) => setViewMode(val as "MAP" | "CHART")}
              options={[
                {
                  label: "Mapa",
                  value: "MAP",
                  icon: <EnvironmentOutlined />,
                },
                {
                  label: "Gráfico",
                  value: "CHART",
                  icon: <BarChartOutlined />,
                },
              ]}
            />
          </Flex>
        </Flex>
      }
    >
      <Flex gap={8} style={{ marginBottom: 30 }}>
        <Select
          size="small"
          style={{ width: "60%" }}
          placeholder="Seleccionar Lote"
          value={selectedLotId}
          onChange={(value) => setSelectedLotId(value)}
          options={lots.map((l) => ({ label: l.name, value: l.id }))}
        />
        <Select
          size="small"
          style={{ width: "40%" }}
          placeholder="Seleccionar Piso"
          value={selectedFloorId}
          onChange={(value) => setSelectedFloorId(value)}
          options={floors.map((f) => ({
            label: `Piso ${f.floorNumber}`,
            value: f.id,
          }))}
          disabled={floors.length === 0}
        />
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" style={{ padding: "28px 0" }}>
          <Spin size="small" description="Cargando espacios..." />
        </Flex>
      ) : spaces.length === 0 ? (
        <Flex justify="center" align="center" style={{ padding: "24px 0" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            No hay espacios registrados para esta selección.
          </Text>
        </Flex>
      ) : viewMode === "CHART" ? (
        <Flex
          vertical
          gap={8}
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            padding: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          {statsItems.map((item) => {
            const pct =
              totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
            return (
              <Flex key={item.label} vertical gap={2}>
                <Flex justify="space-between">
                  <Text strong style={{ fontSize: 12 }}>
                    {item.label}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.count} ({pct}%)
                  </Text>
                </Flex>
                <Progress
                  size="small"
                  percent={pct}
                  showInfo={false}
                  strokeColor={item.color}
                />
              </Flex>
            );
          })}
        </Flex>
      ) : (
        <div
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            padding: "12px",
            border: "1px solid #e2e8f0",
            maxHeight: "230px",
            overflowY: "auto",
          }}
        >
          <Flex
            justify="center"
            wrap="wrap"
            gap={10}
            style={{ marginBottom: 10, fontSize: 11 }}
          >
            <span>
              <span style={{ color: "#22c55e", fontWeight: "bold" }}>■</span>{" "}
              Libre
            </span>
            <span>
              <span style={{ color: "#0284c7", fontWeight: "bold" }}>■</span>{" "}
              Exclusivo Reserva
            </span>
            <span>
              <span style={{ color: "#64748b", fontWeight: "bold" }}>■</span>{" "}
              Ocupado
            </span>
            <span>
              <span style={{ color: "#ef4444", fontWeight: "bold" }}>■</span>{" "}
              Fuera de servicio
            </span>
          </Flex>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))",
              gap: "8px",
            }}
          >
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
                <Tooltip
                  key={space.id}
                  title={`Espacio: ${space.spaceNumber} | Estado: ${space.status}`}
                >
                  <div
                    style={{
                      backgroundColor: bgColor,
                      border: `1.5px solid ${borderColor}`,
                      borderRadius: "8px",
                      padding: "6px 4px",
                      textAlign: "center",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: "50px",
                    }}
                  >
                    <Text strong style={{ fontSize: 12, color: textColor }}>
                      {space.spaceNumber}
                    </Text>

                    <div>
                      {isOccupied && (
                        <CarFilled
                          style={{ fontSize: 16, color: "#475569" }}
                        />
                      )}
                      {isFree && (
                        <CheckCircleFilled
                          style={{ fontSize: 15, color: "#22c55e" }}
                        />
                      )}
                      {isReserved && (
                        <TagFilled
                          style={{ fontSize: 15, color: "#0284c7" }}
                        />
                      )}
                      {isOutOfService && (
                        <CloseCircleFilled
                          style={{ fontSize: 14, color: "#ef4444" }}
                        />
                      )}
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