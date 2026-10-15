"use client";

import { PlusOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Form, message, Modal } from "antd";
import { useState } from "react";
import HeaderPage from "@/app/components/HeaderPage";
import {
  createParkingLot,
  getParkingLot,
  updateParkingLot,
} from "@/app/lib/api/lots";
import type { ParkingLot, ParkingLotFields } from "@/app/lib/api/lots";
import { requiredText } from "@/app/lib/utils";
import DataTableParkingLot from "./components/DataTableParkingLot";
import FormParkingLot from "./components/FormParkingLot";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function getParkingLotFields(
  values: Record<string, unknown>,
): ParkingLotFields {
  const capacity = values.capacity;
  if (
    typeof capacity !== "number" ||
    !Number.isInteger(capacity) ||
    capacity < 1
  ) {
    throw new Error("La capacidad debe ser un número entero mayor que cero.");
  }

  return {
    name: requiredText(values, "name", "El nombre"),
    address: requiredText(values, "address", "La dirección"),
    capacity,
  };
}

const LotsPage = () => {
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({ name: "", address: "", capacity: 1 });
    setMode("create");
    setSelectedLot(null);
    setModalOpen(true);
  };

  const openEditModal = async (id: number) => {
    try {
      const lot = await getParkingLot(id);
      form.resetFields();
      form.setFieldsValue({
        name: lot.name,
        address: lot.address,
        capacity: lot.capacity,
      });
      setMode("edit");
      setSelectedLot(lot);
      setModalOpen(true);
    } catch (error) {
      messageApi.error(
        `No se pudo cargar el estacionamiento: ${getErrorMessage(error)}`,
      );
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setSelectedLot(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const fields = getParkingLotFields(values);
      if (mode === "create") {
        await createParkingLot(fields);
        messageApi.success("Estacionamiento creado correctamente.");
      } else {
        if (!selectedLot) {
          throw new Error("No se seleccionó un estacionamiento para editar.");
        }
        await updateParkingLot(selectedLot.id, fields);
        messageApi.success("Estacionamiento actualizado correctamente.");
      }
      setModalOpen(false);
      setSelectedLot(null);
      form.resetFields();
      setReloadKey((key) => key + 1);
    } catch (error) {
      messageApi.error(
        `No se pudo guardar el estacionamiento: ${getErrorMessage(error)}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <HeaderPage
        title="Localidades"
        description="Manejar las localidades de estacionamiento."
      />

      <Card
        title="Todos los estacionamientos"
        styles={{ body: { padding: 0 } }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Crear estacionamiento
          </Button>
        }
      >
        <DataTableParkingLot
          reloadKey={reloadKey}
          onEdit={openEditModal}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={
          mode === "edit" ? "Editar estacionamiento" : "Crear estacionamiento"
        }
        okText="Guardar cambios"
        cancelText="Cancelar"
        confirmLoading={saving}
        onCancel={closeModal}
        onOk={() => {
          void form.submit();
        }}
        destroyOnHidden
      >
        <FormParkingLot
          form={form}
          initialValues={
            selectedLot
              ? {
                  name: selectedLot.name,
                  address: selectedLot.address,
                  capacity: selectedLot.capacity,
                }
              : { capacity: 1 }
          }
          onSubmit={handleSubmit}
        />
      </Modal>
    </Flex>
  );
};

export default LotsPage;
