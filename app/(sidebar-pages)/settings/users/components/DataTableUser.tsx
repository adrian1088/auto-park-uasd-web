"use client";

import { deleteUser, getUsersPaginated } from "@/app/lib/api/users";
import type { User } from "@/app/lib/api/users";
import { DEFAULT_PAGE_SIZE } from "@/app/lib/constants";
import {
  Alert,
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import type { TableProps } from "antd";
import { useEffect, useState } from "react";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

export type DataTableUserProps = {
  /** Cambiar este valor fuerza una recarga del listado. */
  reloadKey?: number;
  onEdit: (id: number) => Promise<void>;
};

const DataTableUser = ({
  reloadKey = 0,
  onEdit,
}: DataTableUserProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [localReload, setLocalReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await getUsersPaginated({ page, limit: pageSize });
        if (!active) return;
        setUsers(response.data);
        setTotal(response.meta.total);
      } catch (error) {
        if (active) setLoadError(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadUsers();
    return () => {
      active = false;
    };
    // onTotalChange se omite a propósito para no recargar si el padre cambia su identidad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, reloadKey, localReload]);

  const handleEdit = async (id: number) => {
    setEditingUserId(id);
    try {
      await onEdit(id);
    } finally {
      setEditingUserId(null);
    }
  };

  const handleDelete = async (user: User) => {
    setDeletingUserId(user.id);
    try {
      await deleteUser(user.id);
      messageApi.success("Usuario eliminado correctamente.");
      if (page > 1 && users.length === 1) {
        setPage(page - 1);
      } else {
        setLocalReload((key) => key + 1);
      }
    } catch (error) {
      messageApi.error(
        `No se pudo eliminar el usuario: ${getErrorMessage(error)}`,
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  const columns: TableProps<User>["columns"] = [
    { title: "Nombre", dataIndex: "name", key: "name" },
    { title: "Correo", dataIndex: "email", key: "email" },
    { title: "Teléfono", dataIndex: "phone", key: "phone" },
    { title: "Rol", dataIndex: "role", key: "role" },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {status === "active" ? "Activo" : "Inactivo"}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_value, user) => (
        <Space>
          <Button
            type="link"
            loading={editingUserId === user.id}
            disabled={editingUserId !== null}
            onClick={() => void handleEdit(user.id)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Eliminar usuario"
            description={`¿Seguro que deseas eliminar a ${user.name}?`}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{
              danger: true,
              loading: deletingUserId === user.id,
            }}
            onConfirm={() => void handleDelete(user)}
          >
            <Button
              type="link"
              danger
              loading={deletingUserId === user.id}
              disabled={deletingUserId !== null}
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
          title="No se pudieron cargar los usuarios."
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
      <Table<User>
        rowKey="id"
        columns={columns}
        dataSource={users}
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

export default DataTableUser;
