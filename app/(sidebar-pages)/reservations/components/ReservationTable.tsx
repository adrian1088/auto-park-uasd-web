"use client";

import {
  getReservationsPaginated,
  type Reservation,
} from "@/app/lib/api/reservations";
import { getParkingSpaces, type ParkingSpace } from "@/app/lib/api/spaces";
import { DEFAULT_PAGE_SIZE } from "@/app/lib/constants";
import { CopyOutlined, DeleteOutlined, QrcodeOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableProps } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

const { Text } = Typography;

export type ExtendedReservation = Reservation & {
  id?: number | string;
  status?: string | null;
  hasTicket?: boolean;
  has_ticket?: boolean;
  ticketId?: number | string | null;
  ticket_id?: number | string | null;
  tickets?: Array<{ id?: number | string }> | null;
  qrCode?: string | null;
  qr_code?: string | null;
  qrToken?: string | null;
  code?: string | null;
  parkingSpaceId?: number | null;
  parking_space_id?: number | null;
  parkingSpace?: {
    id?: number;
    spaceNumber?: string | number;
    space_number?: string | number;
    floor?: {
      floorNumber?: string | number;
      lot?: {
        id?: number;
        name?: string;
      } | null;
    } | null;
  } | null;
};

type Props = {
  reloadKey?: number;
  onDelete?: (reservation: ExtendedReservation) => Promise<void> | void;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function getQrValue(row: ExtendedReservation): string | null {
  const candidate =
    row.qrCode ?? row.qr_code ?? row.qrToken ?? row.code ?? null;
  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim();
  }
  return null;
}

const formatDate = (value?: string) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "—";

function getReservationStatusTag(reservation: ExtendedReservation) {
  const status = String(reservation.status || "").trim().toUpperCase();

  const hasTicket =
    reservation.hasTicket === true ||
    reservation.has_ticket === true ||
    reservation.ticketId != null ||
    reservation.ticket_id != null ||
    (Array.isArray(reservation.tickets) && reservation.tickets.length > 0) ||
    status === "CONFIRMED";

  // Un ticket vinculado siempre tiene prioridad sobre el vencimiento de 25 minutos
  if (hasTicket) {
    return <Tag color="blue">Confirmado</Tag>;
  }

  const now = dayjs();
  const start = reservation.startTime ? dayjs(reservation.startTime) : null;
  const end = reservation.endTime ? dayjs(reservation.endTime) : null;

  if (!start?.isValid() || !end?.isValid()) {
    return <Tag color="default">Sin horario</Tag>;
  }

  if (status === "EXPIRED" || now.isAfter(end) || now.isSame(end)) {
    return <Tag color="error">Vencida</Tag>;
  }

  if (now.isBefore(start)) {
    return <Tag color="processing">Por llegar</Tag>;
  }

  return <Tag color="success">Vigente</Tag>;
}

export const ReservationTable = ({ reloadKey = 0, onDelete }: Props) => {
  const [data, setData] = useState<ExtendedReservation[]>([]);
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [localReload, setLocalReload] = useState(0);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const spaceById = useMemo(() => {
    const map = new Map<number, ParkingSpace>();
    for (const s of spaces) {
      map.set(Number(s.id), s);
    }
    return map;
  }, [spaces]);

  useEffect(() => {
    let active = true;
    void getParkingSpaces()
      .then((list) => {
        if (active) setSpaces(list ?? []);
      })
      .catch(() => {
        // Si no cargan los espacios extra, se usa lo que traiga la reserva
      });
    return () => {
      active = false;
    };
  }, [reloadKey, localReload]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await getReservationsPaginated({
          page,
          limit: pageSize,
        });
        if (!active) return;
        setData((response.data ?? []) as ExtendedReservation[]);
        setTotal(response.meta?.total ?? response.data?.length ?? 0);
      } catch (error) {
        if (active) setLoadError(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [page, pageSize, reloadKey, localReload]);

  const copyQr = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      messageApi.success("Código QR copiado.");
    } catch {
      messageApi.warning("No se pudo copiar el código.");
    }
  };

  const handleDeleteRow = async (row: ExtendedReservation) => {
    if (!onDelete || row.id === undefined || row.id === null) return;
    setDeletingId(row.id);
    try {
      await onDelete(row);
      setLocalReload((k) => k + 1);
    } catch (error) {
      console.error("[ReservationTable][handleDeleteRow] Error:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableProps<ExtendedReservation>["columns"] = [
    {
      title: "Espacio / Ubicación",
      key: "space",
      render: (_, row) => {
        const spaceId = Number(
          row.parkingSpace?.id ?? row.parkingSpaceId ?? row.parking_space_id,
        );
        const matchedSpace = Number.isFinite(spaceId)
          ? spaceById.get(spaceId)
          : undefined;

        const spaceLabel =
          row.parkingSpace?.spaceNumber ??
          row.parkingSpace?.space_number ??
          matchedSpace?.spaceNumber ??
          (Number.isFinite(spaceId) && spaceId > 0 ? `#${spaceId}` : "—");

        const floorNum =
          row.parkingSpace?.floor?.floorNumber ?? matchedSpace?.floor?.floorNumber;
        const lotName =
          row.parkingSpace?.floor?.lot?.name ?? matchedSpace?.floor?.lot?.name;

        return (
          <Space orientation="vertical" size={2}>
            <Tag color="geekblue" style={{ width: "fit-content", margin: 0 }}>
              Espacio {spaceLabel}
            </Tag>
            {(lotName || floorNum !== undefined) && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {[lotName, floorNum !== undefined ? `Piso ${floorNum}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "Placa",
      dataIndex: "vehiclePlateNumber",
      key: "vehiclePlateNumber",
      render: (plate?: string | null) =>
        plate ? (
          <Tag color="blue" style={{ fontFamily: "monospace", fontWeight: 600 }}>
            {plate}
          </Tag>
        ) : (
          <Text type="secondary">Sin placa</Text>
        ),
    },
    {
      title: "Horario (Primicia)",
      key: "schedule",
      render: (_, row) => (
        <Space orientation="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>Inicio: {formatDate(row.startTime)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Fin: {formatDate(row.endTime)}
          </Text>
        </Space>
      ),
    },
    {
     title: "Código QR",
      key: "qrCode",
      render: (_, row) => {
        const qr = getQrValue(row);
        if (!qr) {
          return <Text type="secondary">Sin QR</Text>;
        }
        return (
          <Space size={6}>
            <Tag
              icon={<QrcodeOutlined />}
              style={{
                margin: 0,
                fontWeight: 600,
                color: "#0369a1",
                backgroundColor: "#e0f2fe",
                borderColor: "#bae6fd",
              }}
            >
              QR Listo
            </Tag>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => void copyQr(qr)}
              title="Copiar código QR"
            />
          </Space>
        );
      },
    },
    {
      title: "Estado",
      key: "status",
      render: (_, row) => getReservationStatusTag(row),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_, row) => {
        if (!onDelete || row.id === undefined || row.id === null) {
          return <Text type="secondary">—</Text>;
        }
        const isRowDeleting = deletingId === row.id;
        return (
          <Popconfirm
            title="Eliminar reservación"
            description="¿Seguro que deseas eliminar esta reservación?"
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true, loading: isRowDeleting }}
            onConfirm={() => void handleDeleteRow(row)}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={isRowDeleting}
            >
              Eliminar reservación
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      {loadError && (
        <Alert
          type="error"
          showIcon
          style={{ margin: 16 }}
          title="No se pudieron cargar las reservaciones."
          description={loadError}
          action={
            <Button
              size="small"
              onClick={() => setLocalReload((key) => key + 1)}
            >
              Reintentar
            </Button>
          }
        />
      )}
      <Table<ExtendedReservation>
        rowKey={(reservation) =>
          String(
            reservation.id ??
              `${reservation.parkingSpaceId}-${reservation.startTime ?? ""}`,
          )
        }
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 880 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          style: { paddingRight: 24 },
        }}
        onChange={(pagination) => {
          setPage(pagination.current ?? 1);
          setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE);
        }}
      />
    </>
  );
};