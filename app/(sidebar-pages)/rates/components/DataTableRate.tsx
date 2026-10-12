"use client";

import { deleteRate, getPaginatedRates } from "@/app/lib/api/rates";
import type { Rate, RateType } from "@/app/lib/api/rates";
import { DEFAULT_PAGE_SIZE } from "@/app/lib/constants";
import { Alert, Button, Popconfirm, Space, Table, message } from "antd";
import type { TableProps } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { rateTypeOptions } from "./FormRate";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

const formatDate = (value?: string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "—";

export type DataTableRateProps = {
  parkingLotId?: number;
  type?: RateType;
  /** Cambiar este valor fuerza una recarga del listado. */
  reloadKey?: number;
  onEdit: (id: number) => Promise<void>;
};

const DataTableRate = ({
  parkingLotId,
  type,
  reloadKey = 0,
  onEdit,
}: DataTableRateProps) => {
  const [data, setData] = useState<Rate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [localReload, setLocalReload] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    setPage(1);
  }, [parkingLotId, type]);

  useEffect(() => {
    if (parkingLotId === undefined || !type) {
      setData([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await getPaginatedRates({
          page,
          limit: pageSize,
          parkingLotId,
          type,
        });
        if (!active) return;
        setData(response.data);
        setTotal(response.total);
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
  }, [parkingLotId, type, page, pageSize, reloadKey, localReload]);

  const handleEdit = async (id: number) => {
    setEditingId(id);
    try {
      await onEdit(id);
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (rate: Rate) => {
    setDeletingId(rate.id);
    try {
      await deleteRate(rate.id);
      messageApi.success("Tarifa eliminada correctamente.");
      if (page > 1 && data.length === 1) {
        setPage(page - 1);
      } else {
        setLocalReload((key) => key + 1);
      }
    } catch (error) {
      messageApi.error(
        `No se pudo eliminar la tarifa: ${getErrorMessage(error)}`,
      );
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableProps<Rate>["columns"] = [
    {
      title: "Estacionamiento",
      dataIndex: "parkingLot",
      key: "parkingLot",
      render: (parkingLot: { id: number; name: string }) => parkingLot.name,
    },
    {
      title: "Tipo",
      dataIndex: "type",
      key: "type",
      render: (value: RateType) =>
        rateTypeOptions.find((option) => option.value === value)?.label ??
        value,
    },
    {
      title: "Monto",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number | string) => Number(amount).toFixed(2),
    },
    {
      title: "Válida desde",
      dataIndex: "validFrom",
      key: "validFrom",
      render: formatDate,
    },
    {
      title: "Válida hasta",
      dataIndex: "validTo",
      key: "validTo",
      render: formatDate,
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_value, rate) => (
        <Space>
          <Button
            type="link"
            loading={editingId === rate.id}
            disabled={editingId !== null}
            onClick={() => void handleEdit(rate.id)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Eliminar tarifa"
            description="¿Seguro que deseas eliminar esta tarifa?"
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true, loading: deletingId === rate.id }}
            onConfirm={() => void handleDelete(rate)}
          >
            <Button
              type="link"
              danger
              loading={deletingId === rate.id}
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
          title="No se pudieron cargar las tarifas."
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
      <Table<Rate>
        rowKey="id"
        columns={columns}
        dataSource={parkingLotId === undefined || !type ? [] : data}
        loading={loading}
        locale={{
          emptyText:
            parkingLotId === undefined || !type
              ? "Selecciona un estacionamiento y un tipo de tarifa."
              : "Sin tarifas.",
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
        }}
        onChange={(pagination) => {
          setPage(pagination.current ?? 1);
          setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE);
        }}
      />
    </>
  );
};

export default DataTableRate;
