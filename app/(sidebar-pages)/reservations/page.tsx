"use client";

import HeaderPage from "@/app/components/HeaderPage";
import {
  createReservation,
  type ReservationFields,
} from "@/app/lib/api/reservations";
import {
  getParkingSpaces,
  type ParkingSpace,
} from "@/app/lib/api/spaces";
import { HttpError } from "@/app/lib/http";
import { Button, Card, Flex, Form, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { ReservationModalForm } from "./components/ReservationModalForm";
import { ReservationTable } from "./components/ReservationTable";

function getErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    const body = error.body;
    if (body && typeof body === "object" && "message" in body) {
      const detail = body.message;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) return detail.join(", ");
    }
  }
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

type ReservationFormValues = {
  startTime: dayjs.Dayjs;
  endTime: dayjs.Dayjs;
  parkingSpaceId: number;
  vehiclePlateNumber?: string;
};

function getReservationFields(values: ReservationFormValues): ReservationFields {
  if (!dayjs.isDayjs(values.startTime)) {
    throw new Error("La fecha de inicio es obligatoria.");
  }
  if (!dayjs.isDayjs(values.endTime)) {
    throw new Error("La fecha de fin es obligatoria.");
  }
  if (!values.endTime.isAfter(values.startTime)) {
    throw new Error("La fecha de fin debe ser posterior a la fecha de inicio.");
  }
  if (!Number.isInteger(values.parkingSpaceId) || values.parkingSpaceId < 1) {
    throw new Error("El espacio es obligatorio.");
  }

  const plate = values.vehiclePlateNumber?.trim();
  return {
    startTime: values.startTime.toISOString(),
    endTime: values.endTime.toISOString(),
    parkingSpaceId: values.parkingSpaceId,
    ...(plate ? { vehiclePlateNumber: plate } : {}),
  };
}

const ReservationsPage = () => {
  const [form] = Form.useForm<ReservationFormValues>();
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(false);
  const [spacesReload, setSpacesReload] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    let active = true;

    const loadSpaces = async () => {
      setSpacesLoading(true);
      try {
        const data = await getParkingSpaces();
        if (active) setSpaces(data);
      } catch (error) {
        if (active) {
          messageApi.error(
            `No se pudieron cargar los espacios: ${getErrorMessage(error)}`,
          );
        }
      } finally {
        if (active) setSpacesLoading(false);
      }
    };

    void loadSpaces();
    return () => {
      active = false;
    };
  }, [messageApi, spacesReload]);

  const openCreateModal = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async (values: ReservationFormValues) => {
    setSaving(true);
    try {
      await createReservation(getReservationFields(values));
      messageApi.success("Reservación creada correctamente.");
      setModalOpen(false);
      form.resetFields();
      setReloadKey((key) => key + 1);
      setSpacesReload((key) => key + 1);
    } catch (error) {
      messageApi.error(
        `No se pudo crear la reservación: ${getErrorMessage(error)}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <HeaderPage
        title="Reservaciones"
        description="Gestionar las reservaciones registradas en el sistema."
      />

      <Card
        title="Todas las reservaciones"
        styles={{ body: { padding: 0 } }}
        extra={
          <Button
            type="primary"
            onClick={openCreateModal}
            loading={spacesLoading}
          >
            Nueva reservación
          </Button>
        }
      >
        <ReservationTable reloadKey={reloadKey} />
      </Card>

      <ReservationModalForm
        open={modalOpen}
        onCancel={closeModal}
        onFinish={handleSubmit}
        loading={saving}
        form={form}
        spaces={spaces}
      />
    </Flex>
  );
};

export default ReservationsPage;
