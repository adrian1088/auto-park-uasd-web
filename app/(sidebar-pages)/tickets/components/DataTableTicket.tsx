"use client";

import { Alert, Button, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { useEffect, useState } from "react";
import { getTicketsPaginated } from "@/app/lib/api/tickets";
import type { Ticket, TicketFilters, TicketStatus } from "@/app/lib/api/tickets";
import { DEFAULT_PAGE_SIZE } from "@/app/lib/constants";
import { formatDateTime, formatMoney } from "@/app/lib/utils/format";

export const ticketStatusLabels: Record<
  TicketStatus,
  { label: string; color: string }
> = {
  ACTIVE: { label: "Activo", color: "blue" },
  PAID: { label: "Pagado", color: "green" },
  CANCELLED: { label: "Cancelado", color: "red" },
  COMPLETED: { label: "Completado", color: "default" },
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

export type DataTableTicketProps = {
  /** Filtros que se envían al servidor. */
  filters: TicketFilters;
  onView: (id: number) => void;
};

const DataTableTicket = ({ filters, onView }: DataTableTicketProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Al cambiar los filtros se vuelve a la primera página.
  const [prevFilters, setPrevFilters] = useState(filters);
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setPage(1);
  }

  useEffect(() => {
    let active = true;

    const loadTickets = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await getTicketsPaginated({
          ...filters,
          page,
          limit: pageSize,
        });
        if (!active) return;
        setTickets(response.data);
        setTotal(response.meta.total);
      } catch (error) {
        if (active) setLoadError(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadTickets();
    return () => {
      active = false;
    };
  }, [filters, page, pageSize, reload]);

  const columns: TableProps<Ticket>["columns"] = [
    { title: "Código", dataIndex: "code", key: "code" },
    {
      title: "Entrada",
      dataIndex: "entranceAt",
      key: "entranceAt",
      render: formatDateTime,
    },
    {
      title: "Salida",
      dataIndex: "exitAt",
      key: "exitAt",
      render: formatDateTime,
    },
    {
      title: "Tarifa",
      dataIndex: "rateAmount",
      key: "rateAmount",
      render: formatMoney,
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (status: TicketStatus) => (
        <Tag color={ticketStatusLabels[status].color}>
          {ticketStatusLabels[status].label}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_value, ticket) => (
        <Button type="link" onClick={() => onView(ticket.id)}>
          Ver
        </Button>
      ),
    },
  ];

  return (
    <>
      {loadError && (
        <Alert
          type="error"
          showIcon
          title="No se pudieron cargar los tickets."
          description={loadError}
          action={
            <Button size="small" onClick={() => setReload((key) => key + 1)}>
              Reintentar
            </Button>
          }
        />
      )}
      <Table<Ticket>
        rowKey="id"
        columns={columns}
        dataSource={tickets}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          style: { paddingRight: "24px" },
        }}
        onChange={(pagination) => {
          setPage(pagination.current ?? 1);
          setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE);
        }}
      />
    </>
  );
};

export default DataTableTicket;
