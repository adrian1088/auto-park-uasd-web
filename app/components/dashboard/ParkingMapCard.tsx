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
  CarFilled,
  CheckCircleFilled,
  CloseCircleFilled,
  EnvironmentOutlined,
  TagFilled,
} from "@ant-design/icons";
import { http } from "@/app/lib/http";
import type { ApiResponseList } from "@/app/lib/api/base";
import { getParkingLots, type ParkingLot } from "@/app/lib/api/lots";
import {
  getParkingSpaces,
  type ParkingSpace,
} from "@/app/lib/api/spaces";
import type { ParkingFloor } from "@/app/lib/api/floors";

const { Text } = Typography;

export interface ParkingMapCardProps {
  refreshTrigger: number;
  selectedLot?: number | "ALL";
}

export function ParkingMapCard({
  refreshTrigger,
  selectedLot,
}: ParkingMapCardProps) {
  const [viewMode, setViewMode] = useState<"MAP" | "CHART">("MAP");

  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [floors, setFloors] = useState<ParkingFloor[]>([]);
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);

  const [localLotId, setLocalLotId] = useState<number | undefined>(undefined);
  const [selectedFloorId, setSelectedFloorId] = useState<number | undefined>(
    undefined,
  );

  const [loading, startTransition] = useTransition();

  const isAllMode = selectedLot === "ALL";
  const effectiveLotId: number | undefined = isAllMode
    ? localLotId
    : typeof selectedLot === "number"
      ? selectedLot
      : undefined;

  const fetchLots = useCallback(async () => {
    try {
      const lotsRes = await getParkingLots();
      const lotsList = Array.isArray(lotsRes) ? lotsRes : [];
      setLots(lotsList);
      if (lotsList.length > 0) {
        setLocalLotId((prev) => {
          const exists = lotsList.some((l) => Number(l.id) === Number(prev));
          return exists ? prev : Number(lotsList[0].id);
        });
      }
    } catch (error) {
      console.error("Error al cargar los lotes:", error);
    }
  }, []);

  const fetchFloors = useCallback(async (lotId?: number) => {
    try {
      const response = await http.get<ApiResponseList<ParkingFloor>>(
        "/parking/floors",
        {
          query: lotId !== undefined ? { lotId } : undefined,
        },
      );
      const floorsList = Array.isArray(response?.data) ? response.data : [];
      setFloors(floorsList);
      if (floorsList.length > 0) {
        setSelectedFloorId(Number(floorsList[0].id));
      } else {
        setSelectedFloorId(undefined);
      }
    } catch (error) {
      console.error("Error al cargar los pisos:", error);
    }
  }, []);

  const fetchSpaces = useCallback(
    async (lotId?: number, floorId?: number) => {
      try {
        const spacesRes = await getParkingSpaces(lotId, floorId);
        const spacesList = Array.isArray(spacesRes) ? spacesRes : [];
        setSpaces(spacesList);
      } catch (error) {
        console.error("Error al cargar los espacios:", error);
      }
    },
    [],
  );

  useEffect(() => {
    if (isAllMode) {
      startTransition(() => {
        void fetchLots();
      });
    }
  }, [isAllMode, fetchLots]);

  useEffect(() => {
    startTransition(() => {
      void fetchFloors(effectiveLotId);
    });
  }, [effectiveLotId, fetchFloors]);

  useEffect(() => {
    startTransition(() => {
      void fetchSpaces(effectiveLotId, selectedFloorId);
    });
  }, [effectiveLotId, selectedFloorId, refreshTrigger, fetchSpaces]);

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
                },
                {
                  label: "Ocupación",
                  value: "CHART",
                },
              ]}
            />
          </Flex>
        </Flex>
      }
    >
      <Flex gap={8} style={{ marginBottom: 30 }}>
        {isAllMode && (
          <Select
            size="small"
            style={{ width: "60%" }}
            placeholder="Seleccionar Lote"
            value={localLotId}
            onChange={(value) => setLocalLotId(Number(value))}
            options={lots.map((l) => ({ label: l.name, value: Number(l.id) }))}
          />
        )}
        <Select
          size="small"
          style={{ width: isAllMode ? "40%" : "100%" }}
          placeholder="Seleccionar Piso"
          value={selectedFloorId}
          onChange={(value) => setSelectedFloorId(Number(value))}
          options={floors.map((f) => ({
            label: `Piso ${f.floorNumber}`,
            value: Number(f.id),
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