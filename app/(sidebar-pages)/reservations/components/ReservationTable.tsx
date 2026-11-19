"use client";

import {
  getReservationsPaginated,
  type Reservation,
} from "@/app/lib/api/reservations";
import { DEFAULT_PAGE_SIZE } from "@/app/lib/constants";
import { Alert, Button, Table, Tag } from "antd";
import type { TableProps } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

type Props = {
  reloadKey?: number;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

const formatDate = (value: string) =>
  dayjs(value).format("DD/MM/YYYY HH:mm");

export const ReservationTable = ({ reloadKey = 0 }: Props) => {
  const [data, setData] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [localReload, setLocalReload] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
        setData(response.data);
        setTotal(response.meta.total);
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

  const columns: TableProps<Reservation>["columns"] = [
    {
      title: "Espacio",
      dataIndex: "parkingSpaceId",
      key: "parkingSpaceId",
      render: (spaceId: number) => (
        <Tag color="blue">Espacio #{spaceId}</Tag>
      ),
    },
    {
      title: "Placa",
      dataIndex: "vehiclePlateNumber",
      key: "vehiclePlateNumber",
      render: (plate?: string | null) => plate || "—",
    },
    {
      title: "Inicio",
      dataIndex: "startTime",
      key: "startTime",
      render: formatDate,
    },
    {
      title: "Fin",
      dataIndex: "endTime",
      key: "endTime",
      render: formatDate,
    },
  ];

  return (
    <>
      {loadError && (
        <Alert
          type="error"
          showIcon
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
      <Table<Reservation>
        rowKey={(reservation) =>
          `${reservation.parkingSpaceId}-${reservation.startTime}-${reservation.endTime}`
        }
        columns={columns}
        dataSource={data}
        loading={loading}
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
