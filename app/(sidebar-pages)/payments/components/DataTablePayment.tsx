"use client";

import { Alert, Button, Popconfirm, Space, Table, Tag, message } from "antd";
import type { TableProps } from "antd";
import { useEffect, useState } from "react";
import { deletePayment, getPaymentsPaginated } from "@/app/lib/api/payments";
import type {
  Payment,
  PaymentFilters,
  PaymentMethod,
  PaymentOriginType,
} from "@/app/lib/api/payments";
import { DEFAULT_PAGE_SIZE } from "@/app/lib/constants";
import { formatDateTime, formatMoney } from "@/app/lib/utils/format";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CREDIT_CARD: "Tarjeta de crédito",
  DEBIT_CARD: "Tarjeta de débito",
  PAYPAL: "PayPal",
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

function resolvePaymentOrigin(payment: Payment): {
  kind: PaymentOriginType;
  text: string;
} {
  if (payment.originType) {
    if (payment.originType === "SUBSCRIPTION") {
      return {
        kind: "SUBSCRIPTION",
        text: payment.originLabel || "Renovación de Suscripción",
      };
    }
    if (payment.originType === "RESERVATION") {
      return {
        kind: "RESERVATION",
        text: payment.ticket?.code
          ? `Reservación · #${payment.ticket.code}`
          : payment.originLabel || "Reservación",
      };
    }
    return {
      kind: "COMMON_TICKET",
      text: payment.ticket?.code
        ? `Cliente Común`
        : payment.originLabel || "Cliente Común",
    };
  }

  if (!payment.ticket) {
    return { kind: "SUBSCRIPTION", text: "Renovación de Suscripción" };
  }
  if (payment.ticket.reservationId != null) {
    return {
      kind: "RESERVATION",
      text: payment.ticket.code
        ? `Reservación · #${payment.ticket.code}`
        : "Reservación",
    };
  }
  return {
    kind: "COMMON_TICKET",
    text: payment.ticket.code
      ? `Cliente Común`
      : "Cliente Común",
  };
}

export type DataTablePaymentProps = {
  filters: PaymentFilters;
  reloadKey?: number;
  onEdit: (id: number) => Promise<void>;
};

const DataTablePayment = ({
  filters,
  reloadKey = 0,
  onEdit,
}: DataTablePaymentProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [localReload, setLocalReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const [prevFilters, setPrevFilters] = useState(filters);
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setPage(1);
  }

  useEffect(() => {
    let active = true;

    const loadPayments = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await getPaymentsPaginated({
          ...filters,
          page,
          limit: pageSize,
        });
        if (!active) return;
        setPayments(response.data);
        setTotal(response.meta.total);
      } catch (error) {
        if (active) setLoadError(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPayments();
    return () => {
      active = false;
    };
  }, [filters, page, pageSize, reloadKey, localReload]);

  const handleEdit = async (id: number) => {
    setEditingId(id);
    try {
      await onEdit(id);
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (payment: Payment) => {
    setDeletingId(payment.id);
    try {
      await deletePayment(payment.id);
      messageApi.success("Pago eliminado correctamente.");
      if (page > 1 && payments.length === 1) {
        setPage(page - 1);
      } else {
        setLocalReload((key) => key + 1);
      }
    } catch (error) {
      messageApi.error(`No se pudo eliminar el pago: ${getErrorMessage(error)}`);
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableProps<Payment>["columns"] = [
    {
      title: <span style={{ fontSize: "12.5px" }}>Origen / Referencia</span>,
      key: "origin",
      render: (_value, payment) => {
        const { kind, text } = resolvePaymentOrigin(payment);
        const color =
          kind === "COMMON_TICKET"
            ? "blue"
            : kind === "RESERVATION"
              ? "cyan"
              : "purple";

        return (
          <Tag
            color={color}
            style={{ fontSize: "12px", padding: "1px 8px", borderRadius: "6px" }}
          >
            {text}
          </Tag>
        );
      },
    },
    {
      title: <span style={{ fontSize: "12.5px" }}>Monto</span>,
      dataIndex: "amount",
      key: "amount",
      render: (val) => (
        <span style={{ fontWeight: 600, color: "#3f8600", fontSize: "12.5px" }}>
          {formatMoney(val)}
        </span>
      ),
    },
    {
      title: <span style={{ fontSize: "12.5px" }}>Método de Pago</span>,
      dataIndex: "method",
      key: "method",
      render: (method: PaymentMethod) => (
        <span style={{ fontSize: "12.5px" }}>
          {paymentMethodLabels[method] || method}
        </span>
      ),
    },
    {
      title: <span style={{ fontSize: "12.5px" }}>Fecha de Registro</span>,
      dataIndex: "date",
      key: "date",
      render: (val) => (
        <span style={{ fontSize: "12.5px" }}>{formatDateTime(val)}</span>
      ),
    },
    {
      title: <span style={{ fontSize: "12.5px" }}>Acciones</span>,
      key: "actions",
      render: (_value, payment) => (
        <Space size={8}>
          <Button
            type="link"
            size="small"
            style={{ fontSize: "12.5px", paddingInline: 4 }}
            loading={editingId === payment.id}
            disabled={editingId !== null}
            onClick={() => void handleEdit(payment.id)}
          >
            Auditar
          </Button>
          <Popconfirm
            title="Eliminar registro financiero"
            description="¿Seguro que deseas eliminar esta transacción?"
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true, loading: deletingId === payment.id }}
            onConfirm={() => void handleDelete(payment)}
          >
            <Button
              type="link"
              size="small"
              danger
              style={{ fontSize: "12.5px", paddingInline: 4 }}
              loading={deletingId === payment.id}
              disabled={deletingId !== null}
            >
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ fontSize: "12.5px" }}>
      {contextHolder}
      {loadError && (
        <Alert
          type="error"
          showIcon
          style={{ fontSize: "12.5px", margin: "8px 16px" }}
          title="No se pudieron cargar los pagos."
          description={loadError}
          action={
            <Button size="small" onClick={() => setLocalReload((key) => key + 1)}>
              Reintentar
            </Button>
          }
        />
      )}
      <Table<Payment>
        rowKey="id"
        columns={columns}
        dataSource={payments}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          size: "small",
          showSizeChanger: true,
          style: { paddingRight: "20px", fontSize: "12px" },
        }}
        onChange={(pagination) => {
          setPage(pagination.current ?? 1);
          setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE);
        }}
      />
    </div>
  );
};

export default DataTablePayment;