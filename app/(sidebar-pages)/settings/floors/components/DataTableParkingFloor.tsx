"use client";

import {
  deleteParkingFloor,
  getParkingFloors,
} from "@/app/lib/api/floors";
import type { ParkingFloor } from "@/app/lib/api/floors";
import { Alert, Button, Popconfirm, Space, Table, Tag, message } from "antd";
import type { TableProps } from "antd";
import { useEffect, useState } from "react";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

type Props = {
  parkingLotId?: number;
  reloadKey?: number;
  onEdit: (id: number) => Promise<void>;
};

const DataTableParkingFloor = ({
  parkingLotId,
  reloadKey = 0,
  onEdit,
}: Props) => {
  const [floors, setFloors] = useState<ParkingFloor[]>([]);
  const [localReload, setLocalReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    let active = true;

    const loadFloors = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await getParkingFloors(parkingLotId);
        if (active) setFloors(data);
      } catch (error) {
        if (active) setLoadError(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadFloors();
    return () => {
      active = false;
    };
  }, [parkingLotId, reloadKey, localReload]);

  const handleEdit = async (id: number) => {
    setEditingId(id);
    try {
      await onEdit(id);
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (floor: ParkingFloor) => {
    setDeletingId(floor.id);
    try {
      await deleteParkingFloor(floor.id);
      messageApi.success("Piso eliminado correctamente.");
      setLocalReload((key) => key + 1);
    } catch (error) {
      messageApi.error(`No se pudo eliminar el piso: ${getErrorMessage(error)}`);
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableProps<ParkingFloor>["columns"] = [
    {
      title: "Estacionamiento",
      dataIndex: "parkingLot",
      key: "parkingLot",
      render: (parkingLot: ParkingFloor["parkingLot"]) => parkingLot.name,
    },
    {
      title: "Número de piso",
      dataIndex: "floorNumber",
      key: "floorNumber",
      render: (floorNumber: number) => `Piso ${floorNumber}`,
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (status: ParkingFloor["status"]) => (
        <Tag color={status === "OPEN" ? "green" : "orange"}>
          {status === "OPEN" ? "Abierto" : "Lleno"}
        </Tag>
      ),
    },
    {
      title: "Espacios",
      dataIndex: "spaces",
      key: "spaces",
      render: (spaces: ParkingFloor["spaces"]) => spaces?.length ?? 0,
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_value, floor) => (
        <Space>
          <Button
            type="link"
            loading={editingId === floor.id}
            disabled={editingId !== null}
            onClick={() => void handleEdit(floor.id)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Eliminar piso"
            description={`¿Seguro que deseas eliminar el piso ${floor.floorNumber} de "${floor.parkingLot.name}"?`}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{
              danger: true,
              loading: deletingId === floor.id,
            }}
            onConfirm={() => void handleDelete(floor)}
          >
            <Button
              type="link"
              danger
              loading={deletingId === floor.id}
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
          title="No se pudieron cargar los pisos."
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
      <Table<ParkingFloor>
        rowKey="id"
        columns={columns}
        dataSource={floors}
        loading={loading}
        locale={{
          emptyText: parkingLotId
            ? "Este estacionamiento aún no tiene pisos."
            : "No hay pisos registrados.",
        }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />
    </>
  );
};

export default DataTableParkingFloor;
