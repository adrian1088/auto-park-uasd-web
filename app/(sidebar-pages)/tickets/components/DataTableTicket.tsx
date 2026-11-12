"use client";

import { Alert, Button, Table, Tag, Typography, Card} from "antd";
import type { TableProps } from "antd";
import { useEffect, useState } from "react";
import { getTicketsPaginated } from "@/app/lib/api/tickets";
import type { Ticket, TicketFilters, TicketStatus } from "@/app/lib/api/tickets";
import { DEFAULT_PAGE_SIZE } from "@/app/lib/constants";
import { formatDateTime, formatMoney } from "@/app/lib/utils/format";
import { EyeOutlined} from "@ant-design/icons";

const { Text } = Typography;

export const ticketStatusLabels: Record<
  TicketStatus,
  { label: string; color: string; bg: string }
> = {
  ACTIVE: { label: "Activo", color: "#0284c7", bg: "#e0f2fe" },
  PAID: { label: "Pagado", color: "#16a34a", bg: "#dcfce7" },
  CANCELLED: { label: "Cancelado", color: "#dc2626", bg: "#fee2e2" },
  COMPLETED: { label: "Completado", color: "#64748b", bg: "#f1f5f9" },
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
    { 
      title: <Text strong style={{ color: "#475569" }}>Código</Text>, 
      dataIndex: "code", 
      key: "code",
      render: (code) => <Text strong style={{ color: "#0f172a" }}>{code || "N/A"}</Text>
    },
    { 
      title: <Text strong style={{ color: "#475569" }}>Matrícula</Text>, 
      dataIndex: "plateNumber", 
      key: "plateNumber", 
      render: (plate) => (
        <Tag style={{ background: "#f8fafc", borderColor: "#e2e8f0", color: "#334155", fontWeight: 600, borderRadius: "6px" }}>
          {plate || "N/A"}
        </Tag>
      ) 
    },
    { 
      title: <Text strong style={{ color: "#475569" }}>Espacio</Text>, 
      dataIndex: "spotNumber", 
      key: "spotNumber", 
      render: (spot) => <Text style={{ color: "#334155" }}>{spot || "VIP"}</Text> 
    },
    {
      title: <Text strong style={{ color: "#475569" }}>Entrada</Text>,
      dataIndex: "entranceAt",
      key: "entranceAt",
      render: (date) => <Text type="secondary" style={{ fontSize: "13px" }}>{formatDateTime(date)}</Text>,
    },
    {
      title: <Text strong style={{ color: "#475569" }}>Salida</Text>,
      dataIndex: "exitAt",
      key: "exitAt",
      render: (date) => <Text type="secondary" style={{ fontSize: "13px" }}>{date ? formatDateTime(date) : "En curso"}</Text>,
    },
    {
      title: <Text strong style={{ color: "#475569" }}>Tarifa</Text>,
      dataIndex: "rateAmount",
      key: "rateAmount",
      render: (amount) => <Text strong style={{ color: "#16a34a" }}>{formatMoney(amount)}</Text>,
    },
    {
      title: <Text strong style={{ color: "#475569" }}>Estado</Text>,
      dataIndex: "status",
      key: "status",
      render: (status: TicketStatus) => {
        const config = ticketStatusLabels[status] || { label: status, color: "#334155", bg: "#f1f5f9" };
        return (
          <Tag style={{ color: config.color, background: config.bg, border: "none", fontWeight: 600, padding: "2px 10px", borderRadius: "6px" }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: <Text strong style={{ color: "#475569" }}>Acciones</Text>,
      key: "actions",
      align: "center",
      render: (_value, ticket) => (
        <Button 
          type="text" 
          icon={<EyeOutlined />} 
          onClick={() => onView(ticket.id)}
          style={{ color: "#0284c7", fontWeight: 500 }}
        >
          Ver
        </Button>
      ),
    },
  ];

  return (
    <Card 
      style={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}
      styles={{ body: { padding: "0px" } }}
    >
      {loadError && (
        <div style={{ padding: "16px" }}>
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
        </div>
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
          style: { padding: "16px 24px", margin: 0 },
        }}
        onChange={(pagination) => {
          setPage(pagination.current ?? 1);
          setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE);
        }}
      />
    </Card>
  );
};

export default DataTableTicket;