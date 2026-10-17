"use client";

import { PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Flex, Form, message, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import HeaderPage from "@/app/components/HeaderPage";
import {
  createParkingFloor,
  getParkingFloor,
  updateParkingFloor,
} from "@/app/lib/api/floors";
import type { ParkingFloor, ParkingFloorFields } from "@/app/lib/api/floors";
import { getParkingLots } from "@/app/lib/api/lots";
import type { ParkingLot } from "@/app/lib/api/lots";
import DataTableParkingFloor from "./components/DataTableParkingFloor";
import FormParkingFloor from "./components/FormParkingFloor";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function getParkingFloorFields(
  values: Record<string, unknown>,
): ParkingFloorFields {
  const lotId = Number(values.lotId);
  const floorNumber = values.floorNumber;

  if (!Number.isInteger(lotId)) {
    throw new Error("El estacionamiento es obligatorio.");
  }
  if (typeof floorNumber !== "number" || !Number.isInteger(floorNumber)) {
    throw new Error("El número de piso debe ser un número entero.");
  }

  return { lotId, floorNumber };
}

const ParkingFloorsPage = () => {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [lotsError, setLotsError] = useState<string | null>(null);
  const [filterLotId, setFilterLotId] = useState<number | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedFloor, setSelectedFloor] = useState<ParkingFloor | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const defaultLotId =
    filterLotId ?? (lots[0] ? Number(lots[0].id) : undefined);

  useEffect(() => {
    let active = true;
    getParkingLots()
      .then((data) => {
        if (active) setLots(data);
      })
      .catch((error: unknown) => {
        if (active) setLotsError(getErrorMessage(error));
      });

    return () => {
      active = false;
    };
  }, []);

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      lotId: defaultLotId,
      floorNumber: 1,
    });
    setMode("create");
    setSelectedFloor(null);
    setModalOpen(true);
  };

  const openEditModal = async (id: number) => {
    try {
      const floor = await getParkingFloor(id);
      form.resetFields();
      form.setFieldsValue({
        lotId: Number(floor.lot.id),
        floorNumber: floor.floorNumber,
      });
      setMode("edit");
      setSelectedFloor(floor);
      setModalOpen(true);
    } catch (error) {
      messageApi.error(
        `No se pudo cargar el piso: ${getErrorMessage(error)}`,
      );
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setSelectedFloor(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const fields = getParkingFloorFields(values);
      if (mode === "create") {
        await createParkingFloor(fields);
        messageApi.success("Piso creado correctamente.");
      } else {
        if (!selectedFloor) {
          throw new Error("No se seleccionó un piso para editar.");
        }
        await updateParkingFloor(selectedFloor.id, fields);
        messageApi.success("Piso actualizado correctamente.");
      }
      setFilterLotId(fields.lotId);
      setModalOpen(false);
      setSelectedFloor(null);
      form.resetFields();
      setReloadKey((key) => key + 1);
    } catch (error) {
      messageApi.error(`No se pudo guardar el piso: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <HeaderPage
        title="Pisos de estacionamiento"
        description="Administrar los pisos de cada estacionamiento."
      />

      {lotsError && (
        <Alert
          type="error"
          showIcon
          title="No se pudieron cargar los estacionamientos."
          description={lotsError}
          action={
            <Button
              size="small"
              onClick={() => {
                setLotsError(null);
                getParkingLots()
                  .then(setLots)
                  .catch((error: unknown) =>
                    setLotsError(getErrorMessage(error)),
                  );
              }}
            >
              Reintentar
            </Button>
          }
        />
      )}

      <Card
        title="Todos los pisos"
        styles={{ body: { padding: 0 } }}
        extra={
          <Flex gap={8}>
            <Select
              allowClear
              style={{ minWidth: 220 }}
              placeholder="Todos los estacionamientos"
              value={filterLotId}
              onChange={setFilterLotId}
              options={lots.map((lot) => ({
                label: lot.name,
                value: Number(lot.id),
              }))}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={lots.length === 0}
              onClick={openCreateModal}
            >
              Crear piso
            </Button>
          </Flex>
        }
      >
        <DataTableParkingFloor
          lotId={filterLotId}
          reloadKey={reloadKey}
          onEdit={openEditModal}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={mode === "edit" ? "Editar piso" : "Crear piso"}
        okText="Guardar cambios"
        cancelText="Cancelar"
        confirmLoading={saving}
        onCancel={closeModal}
        onOk={() => {
          void form.submit();
        }}
        destroyOnHidden
      >
        <FormParkingFloor
          form={form}
          lots={lots}
          initialValues={
            selectedFloor
              ? {
                  lotId: Number(selectedFloor.lot.id),
                  floorNumber: selectedFloor.floorNumber,
                }
              : {
                  lotId: defaultLotId,
                  floorNumber: 1,
                }
          }
          onSubmit={handleSubmit}
        />
      </Modal>
    </Flex>
  );
};

export default ParkingFloorsPage;
