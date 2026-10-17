"use client";

import { Button, Card, Flex, Form, message, Modal, Select } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import HeaderPage from "@/app/components/HeaderPage";
import {
  createRate,
  getRate,
  updateRate,
} from "@/app/lib/api/rates";
import type { Rate, RateFields, RateType } from "@/app/lib/api/rates";
import DataTableRate from "./components/DataTableRate";
import FormRate, { rateTypeOptions } from "./components/FormRate";
import { getParkingLots } from "@/app/lib/api/lots";
import type { ParkingLot } from "@/app/lib/api/lots";

function getErrorMessage(error: unknown) {
  console.log("🚀 ~ getErrorMessage ~ error:", error)
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function getRateFields(values: Record<string, unknown>): RateFields {
  const { parkingLotId: rawParkingLotId, type, amount, validFrom, validTo } = values;
  console.log("🚀 ~ getRateFields ~ values:", values)
  const parkingLotId = Number(rawParkingLotId);
  if (isNaN(parkingLotId)) {
    throw new Error("El estacionamiento es obligatorio.");
  }
  if (typeof type !== "string" || !type) {
    throw new Error("El tipo es obligatorio.");
  }
  if (typeof amount !== "number") {
    throw new Error("El monto es obligatorio.");
  }
  if (!validFrom) {
    throw new Error("La fecha de inicio es obligatoria.");
  }

  return {
    parkingLotId,
    type: type as RateType,
    amount,
    validFrom: dayjs(validFrom as string).toISOString(),
    ...(validTo ? { validTo: dayjs(validTo as string).toISOString() } : {}),
  };
}

function toFormValues(rate: Rate) {
  return {
    parkingLotId:  rate.parkingLot.id,
    type: rate.type,
    amount: Number(rate.amount),
    validFrom: dayjs(rate.validFrom),
    validTo: rate.validTo ? dayjs(rate.validTo) : undefined,
  };
}

const RatesPage = () => {
  const [reloadKey, setReloadKey] = useState(0);
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [filterLotId, setFilterLotId] = useState<number | undefined>();
  const [filterType, setFilterType] = useState<RateType | undefined>("HOURLY");
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    getParkingLots()
      .then((data ) => {
        setLots(data);
        setFilterLotId((current) => current ?? data[0]?.id);
      })
      .catch((error) =>
        messageApi.error(
          `No se pudieron cargar los estacionamientos: ${getErrorMessage(error)}`,
        ),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateModal = () => {
    form.resetFields();
    setMode("create");
    setSelectedRate(null);
    setModalOpen(true);
  };

  const openEditModal = async (id: number) => {
    try {
      const rate = await getRate(id);
      console.log("🚀 ~ openEditModal ~ rate:", rate)
      form.resetFields();
      const hey = toFormValues(rate);
      console.log("🚀 ~ openEditModal ~ hey:", hey)
      form.setFieldsValue(hey);
      setMode("edit");
      setSelectedRate(rate);
      setModalOpen(true);
    } catch (error) {
      messageApi.error(
        `No se pudo cargar la tarifa: ${getErrorMessage(error)}`,
      );
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setSelectedRate(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const fields = getRateFields(values);
      if (mode === "create") {
        await createRate(fields);
        messageApi.success("Tarifa creada correctamente.");
      } else {
        if (!selectedRate) {
          throw new Error("No se seleccionó una tarifa para editar.");
        }
        await updateRate(selectedRate.id, fields);
        messageApi.success("Tarifa actualizada correctamente.");
      }
      setFilterLotId(fields.parkingLotId);
      setFilterType(fields.type);
      setModalOpen(false);
      setSelectedRate(null);
      form.resetFields();
      setReloadKey((key) => key + 1);
    } catch (error) {
      messageApi.error(
        `No se pudo guardar la tarifa: ${getErrorMessage(error)}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <HeaderPage
        title="Tarifas"
        description="Manejar las tarifas del sistema."
      />

      <Card
        title="Todas las tarifas"
        styles={{ body: { padding: 0 } }}
        extra={
          <Flex gap={8}>
            <Select
              style={{ minWidth: 200 }}
              placeholder="Estacionamiento"
              value={filterLotId}
              onChange={setFilterLotId}
              options={lots.map((lot) => ({ label: lot.name, value: lot.id }))}
            />
            <Select
              style={{ minWidth: 140 }}
              placeholder="Tipo"
              value={filterType}
              onChange={setFilterType}
              options={rateTypeOptions}
            />
            <Button type="primary" onClick={openCreateModal}>
              Crear Tarifa
            </Button>
          </Flex>
        }
      >
        <DataTableRate
          parkingLotId={filterLotId}
          type={filterType}
          reloadKey={reloadKey}
          onEdit={openEditModal}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={mode === "edit" ? "Editar Tarifa" : "Crear Tarifa"}
        okText="Guardar cambios"
        cancelText="Cancelar"
        confirmLoading={saving}
        onCancel={closeModal}
        onOk={() => {
          void form.submit();
        }}
        destroyOnHidden
      >
        <FormRate
          form={form}
          lots={lots}
          initialValues={selectedRate ? toFormValues(selectedRate) : undefined}
          onSubmit={handleSubmit}
        />
      </Modal>
    </Flex>
  );
};

export default RatesPage;
