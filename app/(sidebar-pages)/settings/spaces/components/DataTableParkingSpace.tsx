"use client";

import {
  deleteParkingSpace,
  getParkingSpacesPaginated,
} from "@/app/lib/api/spaces";
import type { ParkingSpace } from "@/app/lib/api/spaces";
import { DEFAULT_PAGE_SIZE } from "@/app/lib/constants";
import { Alert, Button, Popconfirm, Space, Table, Tag, message } from "antd";
import type { TableProps } from "antd";
import { useEffect, useState } from "react";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

const typeLabels: Record<ParkingSpace["type"], string> = {
  CAR: "Automóvil",
  TRUCK: "Camión",
  MOTORCYCLE: "Motocicleta",
  VAN: "Camioneta",
  BUS: "Autobús",
  SUV: "SUV",
  PICKUP: "Pickup",
};

const statusLabels: Record<ParkingSpace["status"], string> = {
  FREE: "Libre",
  OCCUPIED: "Ocupado",
  RESERVED: "Reservado",
  OUT_OF_SERVICE: "Fuera de servicio",
};

const statusColors: Record<ParkingSpace["status"], string> = {
  FREE: "green",
  OCCUPIED: "red",
  RESERVED: "blue",
  OUT_OF_SERVICE: "default",
};

type Props = {
  lotId?: number;
  floorId?: number;
  reloadKey?: number;
  onEdit: (id: number) => Promise<void>;
};

const DataTableParkingSpace = ({
  lotId,
  floorId,
  reloadKey = 0,
  onEdit,
}: Props) => {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [localReload, setLocalReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [retiringId, setRetiringId] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  // Al cambiar los filtros se vuelve a la primera página.
  const [prevFilters, setPrevFilters] = useState({ lotId, floorId });
  if (prevFilters.lotId !== lotId || prevFilters.floorId !== floorId) {
    setPrevFilters({ lotId, floorId });
    setPage(1);
  }

  useEffect(() => {
    let active = true;

    const loadSpaces = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await getParkingSpacesPaginated({
          page,
          limit: pageSize,
          lotId,
          floorId,
        });
        if (!active) return;
        setSpaces(response.data);
        setTotal(response.meta.total);
      } catch (error) {
        if (active) setLoadError(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadSpaces();
    return () => {
      active = false;
    };
  }, [page, pageSize, lotId, floorId, reloadKey, localReload]);

  const handleEdit = async (id: number) => {
    setEditingId(id);
    try {
      await onEdit(id);
    } finally {
      setEditingId(null);
    }
  };

  const handleRetire = async (space: ParkingSpace) => {
    setRetiringId(space.id);
    try {
      await deleteParkingSpace(space.id);
      messageApi.success("El espacio fue retirado del servicio.");
      setLocalReload((key) => key + 1);
    } catch (error) {
      messageApi.error(
        `No se pudo retirar el espacio: ${getErrorMessage(error)}`,
      );
    } finally {
      setRetiringId(null);
    }
  };

  const columns: TableProps<ParkingSpace>["columns"] = [
    {
      title: "Estacionamiento",
      dataIndex: ["floor", "lot", "name"],
      key: "lot",
    },
    {
      title: "Piso",
      dataIndex: ["floor", "floorNumber"],
      key: "floor",
      render: (floorNumber: number) => `Piso ${floorNumber}`,
    },
    { title: "Espacio", dataIndex: "spaceNumber", key: "spaceNumber" },
    {
      title: "Tipo de vehículo",
      dataIndex: "type",
      key: "type",
      render: (type: ParkingSpace["type"]) => typeLabels[type] ?? type,
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (status: ParkingSpace["status"]) => (
        <Tag color={statusColors[status]}>{statusLabels[status] ?? status}</Tag>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_value, space) => (
        <Space>
          <Button
            type="link"
            loading={editingId === space.id}
            disabled={editingId !== null}
            onClick={() => void handleEdit(space.id)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Retirar espacio"
            description={`¿Retirar el espacio ${space.spaceNumber} del servicio?`}
            okText="Retirar"
            cancelText="Cancelar"
            okButtonProps={{
              danger: true,
              loading: retiringId === space.id,
            }}
            onConfirm={() => void handleRetire(space)}
          >
            <Button
              type="link"
              danger
              loading={retiringId === space.id}
              disabled={
                retiringId !== null || space.status === "OUT_OF_SERVICE"
              }
            >
              Retirar
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
          title="No se pudieron cargar los espacios."
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
      <Table<ParkingSpace>
        rowKey="id"
        columns={columns}
        dataSource={spaces}
        loading={loading}
        locale={{
          emptyText: floorId
            ? "Este piso aún no tiene espacios."
            : "No hay espacios registrados.",
        }}
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

export default DataTableParkingSpace;
