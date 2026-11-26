"use client";

import { ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Flex, message, Modal, Spin, Tag, Typography } from "antd";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import Descriptions from "@/app/components/Descriptions";
import HeaderPage from "@/app/components/HeaderPage";
import { getTicket } from "@/app/lib/api/tickets";
import type { Ticket, TicketFilters } from "@/app/lib/api/tickets";
import { formatDateTime, formatMoney } from "@/app/lib/utils/format";
import DataTableTicket, { ticketStatusLabels } from "./components/DataTableTicket";
import FilterTicket from "./components/FilterTicket";
import { getErrorMessage } from "@/app/lib/utils";
const { Text } = Typography;

type TicketDetailData = Ticket & {
  vehiclePlateNumber?: string | null;
  vehicle_plate_number?: string | null;
  spaceNumber?: string | number | null;
  spotNumber?: string | number | null;
  spot_number?: string | number | null;
  parkingSpaceId?: number | string | null;
  spot?: {
    id?: number | string;
    spaceNumber?: string | number;
    floorNumber?: number;
  } | null;
  entrance_at?: string | null;
  exit_at?: string | null;
  rate_amount?: number | string | null;
};

function resolvePlate(ticket: TicketDetailData): string {
  const plate =
    ticket.vehiclePlateNumber ??
    ticket.plateNumber ??
    ticket.vehicle_plate_number;
  return plate && String(plate).trim() ? String(plate).trim().toUpperCase() : "N/A";
}

function resolveSpace(ticket: TicketDetailData): string {
  const space =
    ticket.spot?.spaceNumber ??
    ticket.spaceNumber ??
    ticket.spotNumber ??
    ticket.spot_number;

  if (space !== undefined && space !== null && String(space).trim() !== "") {
    const floor = ticket.spot?.floorNumber;
    return floor !== undefined && floor !== null
      ? `P${floor} • ${String(space).trim()}`
      : String(space).trim();
  }

  if (ticket.parkingSpaceId !== undefined && ticket.parkingSpaceId !== null) {
    return `Espacio #${String(ticket.parkingSpaceId)}`;
  }

  return "N/A";
}

const TicketsPage = () => {
  const [filters, setFilters] = useState<TicketFilters>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetailData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!detailOpen || !selectedTicket || !qrCanvasRef.current) return;

    const plate = resolvePlate(selectedTicket);
    const space = resolveSpace(selectedTicket);
    const entranceAt = selectedTicket.entranceAt ?? selectedTicket.entrance_at ?? null;
    const exitAt = selectedTicket.exitAt ?? selectedTicket.exit_at ?? null;
    const rateAmount = Number(
      selectedTicket.rateAmount ?? selectedTicket.rate_amount ?? 0,
    );

    const qrPayload = JSON.stringify({
      code: selectedTicket.code,
      plateNumber: plate,
      spotNumber: space,
      status: selectedTicket.status,
      entranceAt,
      exitAt,
      rateAmount,
    });

    QRCode.toCanvas(
      qrCanvasRef.current,
      qrPayload,
      { width: 160, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } },
      (error: Error | null | undefined) => {
        if (error) console.error("Error al renderizar QR del ticket:", error);
      },
    );
  }, [detailOpen, selectedTicket]);

  const openDetail = async (id: number) => {
    setSelectedTicket(null);
    setDetailOpen(true);
    setLoadingDetail(true);
    try {
      setSelectedTicket((await getTicket(id)) as TicketDetailData);
    } catch (error) {
      setDetailOpen(false);
      const errorMessage = getErrorMessage(error)
      messageApi.error(
        `No se pudo cargar el ticket: ${errorMessage}`,
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const plateValue = selectedTicket ? resolvePlate(selectedTicket) : "N/A";
  const spaceValue = selectedTicket ? resolveSpace(selectedTicket) : "N/A";
  const entranceValue = selectedTicket
    ? selectedTicket.entranceAt ?? selectedTicket.entrance_at ?? undefined
    : undefined;
  const exitValue = selectedTicket
    ? selectedTicket.exitAt ?? selectedTicket.exit_at ?? undefined
    : undefined;
  const rateValue = selectedTicket
    ? Number(selectedTicket.rateAmount ?? selectedTicket.rate_amount ?? 0)
    : 0;

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <Flex justify="space-between" align="flex-start">
        <HeaderPage
          title="Tickets"
          description="Manejar los tickets del sistema."
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
        >
          Refrescar Vista
        </Button>
      </Flex>

      <Card
        title="Todos los tickets"
        styles={{ body: { padding: 0 } }}
        extra={<FilterTicket value={filters} onChange={setFilters} />}
      >
        <DataTableTicket
          key={refreshTrigger}
          filters={filters}
          onView={openDetail}
        />
      </Card>

      <Modal
        open={detailOpen}
        title="Detalle del ticket"
        footer={null}
        onCancel={() => setDetailOpen(false)}
        destroyOnHidden
      >
        <Spin spinning={loadingDetail}>
          {selectedTicket && (
            <Flex vertical gap={16}>
              <Descriptions
                columns={2}
                items={[
                  { key: "code", label: "Código", content: selectedTicket.code },
                  {
                    key: "plateNumber",
                    label: "Matrícula",
                    content: plateValue,
                  },
                  {
                    key: "spotNumber",
                    label: "Espacio",
                    content: spaceValue,
                  },
                  {
                    key: "status",
                    label: "Estado",
                    content: (
                      <Tag color={ticketStatusLabels[selectedTicket.status].color}>
                        {ticketStatusLabels[selectedTicket.status].label}
                      </Tag>
                    ),
                  },
                  {
                    key: "entranceAt",
                    label: "Entrada",
                    content: formatDateTime(entranceValue ?? undefined),
                  },
                  {
                    key: "exitAt",
                    label: "Salida",
                    content: formatDateTime(exitValue ?? undefined),
                  },
                  {
                    key: "rateAmount",
                    label: "Tarifa",
                    content: formatMoney(rateValue),
                  },
                ]}
              />

              <Flex vertical align="center" gap={6} style={{ paddingTop: 8 }}>
                <canvas ref={qrCanvasRef} aria-label="Código QR detallado del ticket" />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  QR con código, matrícula, espacio, horarios, tarifa y estado
                </Text>
              </Flex>
            </Flex>
          )}
        </Spin>
      </Modal>
    </Flex>
  );
};

export default TicketsPage;