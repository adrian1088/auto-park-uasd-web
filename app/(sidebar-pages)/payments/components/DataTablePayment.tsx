"use client";

import { Alert, Button, Popconfirm, Space, Table, message } from "antd";
import type { TableProps } from "antd";
import { useEffect, useState } from "react";
import { deletePayment, getPaymentsPaginated } from "@/app/lib/api/payments";
import type {
  Payment,
  PaymentFilters,
  PaymentMethod,
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
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

export type DataTablePaymentProps = {
  /** Filtros que se envían al servidor. */
  filters: PaymentFilters;
  /** Cambiar este valor fuerza una recarga del listado. */
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

  // Al cambiar los filtros se vuelve a la primera página.
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
      title: "Ticket",
      key: "ticket",
      render: (_value, payment) => payment.ticket.code,
    },
    {
      title: "Monto",
      dataIndex: "amount",
      key: "amount",
      render: formatMoney,
    },
    {
      title: "Método",
      dataIndex: "method",
      key: "method",
      render: (method: PaymentMethod) => paymentMethodLabels[method],
    },
    {
      title: "Fecha",
      dataIndex: "date",
      key: "date",
      render: formatDateTime,
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_value, payment) => (
        <Space>
          <Button
            type="link"
            loading={editingId === payment.id}
            disabled={editingId !== null}
            onClick={() => void handleEdit(payment.id)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Eliminar pago"
            description="¿Seguro que deseas eliminar este pago?"
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true, loading: deletingId === payment.id }}
            onConfirm={() => void handleDelete(payment)}
          >
            <Button
              type="link"
              danger
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
    <>
      {contextHolder}
      {loadError && (
        <Alert
          type="error"
          showIcon
          title="No se pudieron cargar los pagos."
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
      <Table<Payment>
        rowKey="id"
        columns={columns}
        dataSource={payments}
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

export default DataTablePayment;
