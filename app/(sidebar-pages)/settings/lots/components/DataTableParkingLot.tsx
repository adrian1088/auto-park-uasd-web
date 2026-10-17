"use client";

import {
  deleteParkingLot,
  getParkingLotsPaginated,
} from "@/app/lib/api/lots";
import type { ParkingLot } from "@/app/lib/api/lots";
import { DEFAULT_PAGE_SIZE } from "@/app/lib/constants";
import { Alert, Button, Popconfirm, Space, Table, message } from "antd";
import type { TableProps } from "antd";
import { useEffect, useState } from "react";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

type Props = {
  reloadKey?: number;
  onEdit: (id: number) => Promise<void>;
};

const DataTableParkingLot = ({ reloadKey = 0, onEdit }: Props) => {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [localReload, setLocalReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    let active = true;

    const loadLots = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await getParkingLotsPaginated({
          page,
          limit: pageSize,
        });
        if (!active) return;
        setLots(response.data);
        setTotal(response.meta.total);
      } catch (error) {
        if (active) setLoadError(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadLots();
    return () => {
      active = false;
    };
  }, [page, pageSize, reloadKey, localReload]);

  const handleEdit = async (id: number) => {
    setEditingId(id);
    try {
      await onEdit(id);
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (lot: ParkingLot) => {
    setDeletingId(lot.id);
    try {
      await deleteParkingLot(lot.id);
      messageApi.success("Estacionamiento eliminado correctamente.");
      if (page > 1 && lots.length === 1) {
        setPage(page - 1);
      } else {
        setLocalReload((key) => key + 1);
      }
    } catch (error) {
      messageApi.error(
        `No se pudo eliminar el estacionamiento: ${getErrorMessage(error)}`,
      );
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableProps<ParkingLot>["columns"] = [
    { title: "Nombre", dataIndex: "name", key: "name" },
    { title: "Dirección", dataIndex: "address", key: "address" },
    {
      title: "Capacidad",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity: number) => `${capacity} espacios`,
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_value, lot) => (
        <Space>
          <Button
            type="link"
            loading={editingId === lot.id}
            disabled={editingId !== null}
            onClick={() => void handleEdit(lot.id)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Eliminar estacionamiento"
            description={`¿Seguro que deseas eliminar "${lot.name}"?`}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{
              danger: true,
              loading: deletingId === lot.id,
            }}
            onConfirm={() => void handleDelete(lot)}
          >
            <Button
              type="link"
              danger
              loading={deletingId === lot.id}
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
          title="No se pudieron cargar los estacionamientos."
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
      <Table<ParkingLot>
        rowKey="id"
        columns={columns}
        dataSource={lots}
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

export default DataTableParkingLot;
