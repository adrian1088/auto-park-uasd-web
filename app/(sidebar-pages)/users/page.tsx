"use client";

import { Button, Card, Flex, Form, message, Modal } from "antd";
import { useState } from "react";
import HeaderPage from "@/app/components/HeaderPage";
import { createUser, getUser, updateUser } from "@/app/lib/api/users";
import type { User, UserFields } from "@/app/lib/api/users";
import { requiredText } from "@/app/lib/utils";
import DataTableUser from "./components/DataTableUser";
import FormUser from "./components/FormUser";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function getUserFields(values: Record<string, unknown>): UserFields {
  if (typeof values.active !== "boolean") {
    throw new Error("El estado del usuario es obligatorio.");
  }

  return {
    name: requiredText(values, "name", "El nombre"),
    email: requiredText(values, "email", "El correo"),
    phone: requiredText(values, "phone", "El teléfono"),
    role: requiredText(values, "role", "El rol"),
    status: values.active ? "active" : "inactive",
  };
}

const UsersPage = () => {
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      name: "",
      email: "",
      phone: "",
      role: undefined,
      active: true,
    });
    setMode("create");
    setSelectedUser(null);
    setModalOpen(true);
  };

  const openEditModal = async (id: number) => {
    try {
      const user = await getUser(id);
      form.resetFields();
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        active: user.status === "active",
      });
      setMode("edit");
      setSelectedUser(user);
      setModalOpen(true);
    } catch (error) {
      messageApi.error(
        `No se pudo cargar el usuario: ${getErrorMessage(error)}`,
      );
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setSelectedUser(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const userFields = getUserFields(values);
      if (mode === "create") {
        await createUser(userFields);
        messageApi.success("Usuario creado correctamente.");
      } else {
        if (!selectedUser) {
          throw new Error("No se seleccionó un usuario para editar.");
        }
        await updateUser(selectedUser.id, userFields);
        messageApi.success("Usuario actualizado correctamente.");
      }
      setModalOpen(false);
      setSelectedUser(null);
      form.resetFields();
      setReloadKey((key) => key + 1);
    } catch (error) {
      messageApi.error(
        `No se pudo guardar el usuario: ${getErrorMessage(error)}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <HeaderPage
        title="Usuarios"
        description="Manejar los usuarios del sistema."
      />

      <Card
        title={`Todos los usuarios`}
        styles={{
          body: {
            padding: 0,
          },
        }}
        extra={
          <Button type="primary" onClick={openCreateModal}>
            Crear Usuario
          </Button>
        }
      >
        <DataTableUser reloadKey={reloadKey} onEdit={openEditModal} />
      </Card>

      <Modal
        open={modalOpen}
        title={mode === "edit" ? "Editar Usuario" : "Crear Usuario"}
        okText="Guardar cambios"
        cancelText="Cancelar"
        confirmLoading={saving}
        onCancel={closeModal}
        onOk={() => {
          void form.submit();
        }}
        destroyOnHidden
      >
        <FormUser
          form={form}
          initialValues={
            selectedUser
              ? {
                  name: selectedUser.name,
                  email: selectedUser.email,
                  phone: selectedUser.phone,
                  role: selectedUser.role,
                  active: selectedUser.status === "active",
                }
              : { active: true }
          }
          onSubmit={handleSubmit}
        />
      </Modal>
    </Flex>
  );
};

export default UsersPage;
