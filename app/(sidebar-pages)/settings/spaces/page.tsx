"use client";

import { PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Flex, Form, message, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import HeaderPage from "@/app/components/HeaderPage";
import {
  createParkingSpace,
  getParkingSpace,
  PARKING_SPACE_TYPES,
  updateParkingSpace,
} from "@/app/lib/api/spaces";
import type {
  ParkingSpace,
  ParkingSpaceFields,
  ParkingSpaceStatus,
  ParkingSpaceType,
} from "@/app/lib/api/spaces";
import { getParkingFloors } from "@/app/lib/api/floors";
import type { ParkingFloor } from "@/app/lib/api/floors";
import { getParkingLots } from "@/app/lib/api/lots";
import type { ParkingLot } from "@/app/lib/api/lots";
import DataTableParkingSpace from "./components/DataTableParkingSpace";
import FormParkingSpace from "./components/FormParkingSpace";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function isParkingSpaceType(value: unknown): value is ParkingSpaceType {
  return (
    typeof value === "string" &&
    (PARKING_SPACE_TYPES as readonly string[]).includes(value)
  );
}

function getParkingSpaceFields(
  values: Record<string, unknown>,
): ParkingSpaceFields {
  const { spaceNumber, type, floorId } = values;
  const floorIdNumber = Number(floorId);
  if (
    typeof spaceNumber !== "string" ||
    spaceNumber.trim().length === 0 ||
    spaceNumber.trim().length > 10
  ) {
    throw new Error("El número de espacio debe tener entre 1 y 10 caracteres.");
  }
  if (!isParkingSpaceType(type)) {
    throw new Error("Selecciona un tipo de vehículo válido.");
  }
  if (floorIdNumber < 1) {
    throw new Error("El piso es obligatorio.");
  }

  return {
    spaceNumber: spaceNumber.trim(),
    type,
    floorId: floorIdNumber,
  };
}

function getEditableStatus(value: unknown): ParkingSpaceStatus | undefined {
  return value === "FREE" ||
    value === "OUT_OF_SERVICE" ||
    value === "OCCUPIED" ||
    value === "RESERVED"
    ? value
    : undefined;
}

const ParkingSpacesPage = () => {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [floors, setFloors] = useState<ParkingFloor[]>([]);
  const [filterLotId, setFilterLotId] = useState<number | undefined>();
  const [filterFloorId, setFilterFloorId] = useState<number | undefined>();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // El API solo lista pisos de un estacionamiento: el filtrado o, si no hay, el primero.
  const floorsLotId = filterLotId ?? (lots[0] ? Number(lots[0].id) : undefined);

  // El piso del espacio en edición puede ser de otro estacionamiento.
  const formFloors =
    selectedSpace && !floors.some((floor) => floor.id === selectedSpace.floor.id)
      ? [...floors, selectedSpace.floor]
      : floors;

  const loadLots = () =>
    getParkingLots()
      .then((data) => {
        setLoadError(null);
        setLots(data);
      })
      .catch((error: unknown) => setLoadError(getErrorMessage(error)));

  useEffect(() => {
    void loadLots();
  }, []);

  useEffect(() => {
    if (floorsLotId === undefined) return;
    let active = true;
    getParkingFloors(floorsLotId)
      .then((data) => {
        if (active) setFloors(data);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(getErrorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [floorsLotId]);

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      floorId:
        filterFloorId ?? (floors[0] ? Number(floors[0].id) : undefined),
      spaceNumber: "",
      type: "CAR",
    });
    setMode("create");
    setSelectedSpace(null);
    setModalOpen(true);
  };

  const openEditModal = async (id: number) => {
    try {
      const space = await getParkingSpace(id);
      form.resetFields();
      form.setFieldsValue({
        spaceNumber: space.spaceNumber,
        type: space.type,
        floorId: Number(space.floor.id),
        status: space.status,
      });
      setMode("edit");
      setSelectedSpace(space);
      setModalOpen(true);
    } catch (error) {
      messageApi.error(
        `No se pudo cargar el espacio: ${getErrorMessage(error)}`,
      );
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setSelectedSpace(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const fields = getParkingSpaceFields(values);
      if (mode === "create") {
        await createParkingSpace(fields);
        messageApi.success("Espacio creado correctamente.");
      } else {
        if (!selectedSpace) {
          throw new Error("No se seleccionó un espacio para editar.");
        }
        const status = getEditableStatus(values.status);
        await updateParkingSpace(selectedSpace.id, {
          ...fields,
          ...(status ? { status } : {}),
        });
        messageApi.success("Espacio actualizado correctamente.");
      }
      const updatedFloor = formFloors.find(
        (floor) => Number(floor.id) === fields.floorId,
      );
      setFilterLotId(updatedFloor ? Number(updatedFloor.lot.id) : undefined);
      setFilterFloorId(fields.floorId);
      setModalOpen(false);
      setSelectedSpace(null);
      form.resetFields();
      setReloadKey((key) => key + 1);
    } catch (error) {
      messageApi.error(
        `No se pudo guardar el espacio: ${getErrorMessage(error)}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <HeaderPage
        title="Espacios de estacionamiento"
        description="Administrar los espacios disponibles en cada piso."
      />

      {loadError && (
        <Alert
          type="error"
          showIcon
          title="No se pudieron cargar los estacionamientos y pisos."
          description={loadError}
          action={
            <Button size="small" onClick={() => void loadLots()}>
              Reintentar
            </Button>
          }
        />
      )}

      <Card
        title="Todos los espacios"
        styles={{ body: { padding: 0 } }}
        extra={
          <Flex gap={8} wrap>
            <Select
              allowClear
              style={{ minWidth: 200 }}
              placeholder="Todos los estacionamientos"
              value={filterLotId}
              onChange={(value: number | undefined) => {
                setFilterLotId(value);
                setFilterFloorId(undefined);
              }}
              options={lots.map((lot) => ({
                label: lot.name,
                value: Number(lot.id),
              }))}
            />
            <Select
              allowClear
              style={{ minWidth: 200 }}
              placeholder="Todos los pisos"
              disabled={filterLotId === undefined}
              value={filterFloorId}
              onChange={setFilterFloorId}
              options={floors.map((floor) => ({
                label: `Piso ${floor.floorNumber}`,
                value: Number(floor.id),
              }))}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={floors.length === 0}
              onClick={openCreateModal}
            >
              Crear espacio
            </Button>
          </Flex>
        }
      >
        <DataTableParkingSpace
          lotId={filterLotId}
          floorId={filterFloorId}
          reloadKey={reloadKey}
          onEdit={openEditModal}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={mode === "edit" ? "Editar espacio" : "Crear espacio"}
        okText="Guardar cambios"
        cancelText="Cancelar"
        confirmLoading={saving}
        onCancel={closeModal}
        onOk={() => {
          void form.submit();
        }}
        destroyOnHidden
      >
        <FormParkingSpace
          form={form}
          floors={formFloors}
          initialValues={
            selectedSpace
              ? {
                  spaceNumber: selectedSpace.spaceNumber,
                  type: selectedSpace.type,
                  floorId: Number(selectedSpace.floor.id),
                  status: selectedSpace.status,
                }
              : {
                  floorId:
                    filterFloorId ?? (floors[0] ? Number(floors[0].id) : undefined),
                  spaceNumber: "",
                  type: "CAR",
                }
          }
          isEditing={mode === "edit"}
          onSubmit={handleSubmit}
        />
      </Modal>
    </Flex>
  );
};

export default ParkingSpacesPage;
