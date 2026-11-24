"use client";

import HeaderPage from "@/app/components/HeaderPage";
import {
  createReservation,
  deleteReservation,
  type ReservationFields,
} from "@/app/lib/api/reservations";
import { getParkingSpaces, type ParkingSpace } from "@/app/lib/api/spaces";
import { HttpError } from "@/app/lib/http";
import { Button, Card, Flex, Form, message } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import {
  ReservationModalForm,
  type ReservationFormValues,
} from "./components/ReservationModalForm";
import {
  ReservationTable,
  type ExtendedReservation,
} from "./components/ReservationTable";

const PRIMICIA_MINUTES = 25;

type UserPayload = {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
};

type MeResponse = UserPayload & {
  data?: UserPayload;
  user?: UserPayload;
};

function getErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    const body = error.body;
    if (body && typeof body === "object" && "message" in body) {
      const detail = body.message;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) return detail.join(", ");
    }
  }
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

function isStaffRole(role?: unknown): boolean {
  const normalized = String(role || "").trim().toLowerCase();
  return normalized === "admin" || normalized === "operator";
}

async function fetchIsStaff(): Promise<boolean> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"
  ).replace(/\/$/, "");

  try {
    const res = await fetch(`${baseUrl}/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) return false;
    const json = (await res.json()) as MeResponse;
    const role = json?.data?.role ?? json?.user?.role ?? json?.role;
    return isStaffRole(role);
  } catch {
    return false;
  }
}

function getReservationFields(
  values: ReservationFormValues,
  isStaff: boolean,
): ReservationFields & {
  clientName?: string;
  clientEmail?: string;
} {
  if (!dayjs.isDayjs(values.startTime)) {
    throw new Error("La fecha y hora de llegada es obligatoria.");
  }

  const parkingSpaceId = Number(values.parkingSpaceId);
  if (!Number.isInteger(parkingSpaceId) || parkingSpaceId < 1) {
    throw new Error("El espacio es obligatorio.");
  }

  // La hora fin se calcula con 25 minutos de primicia desde la llegada
  const endTime = values.startTime.add(PRIMICIA_MINUTES, "minute");

  const plate = values.vehiclePlateNumber?.trim();
  const clientName = values.clientName?.trim();
  const clientEmail = values.clientEmail?.trim();

  return {
    startTime: values.startTime.toISOString(),
    endTime: endTime.toISOString(),
    parkingSpaceId,
    ...(plate ? { vehiclePlateNumber: plate } : {}),
    ...(isStaff && clientName ? { clientName } : {}),
    ...(isStaff && clientEmail ? { clientEmail } : {}),
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
  const [isStaff, setIsStaff] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const refreshData = useCallback(() => {
    setReloadKey((k) => k + 1);
    setSpacesReload((k) => k + 1);
  }, []);

  const syncRole = useCallback(async (): Promise<boolean> => {
    try {
      const staff = await fetchIsStaff();
      setIsStaff(staff);
      return staff;
    } catch (error) {
      console.error("[ReservationsPage][syncRole] Error:", error);
      setIsStaff(false);
      return false;
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setSpacesLoading(true);
      try {
        const [spacesData, staff] = await Promise.all([
          getParkingSpaces(),
          fetchIsStaff(),
        ]);
        if (!active) return;
        setSpaces(spacesData);
        setIsStaff(staff);
      } catch (error) {
        console.error("[ReservationsPage][loadData] Error:", error);
        if (active) {
          messageApi.error(
            `No se pudieron cargar los espacios: ${getErrorMessage(error)}`,
          );
        }
      } finally {
        if (active) setSpacesLoading(false);
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, [messageApi, spacesReload]);

  const openCreateModal = async () => {
    try {
      await syncRole();
      form.resetFields();
      setModalOpen(true);
    } catch (error) {
      console.error("[ReservationsPage][openCreateModal] Error:", error);
      messageApi.error(`No se pudo abrir el formulario: ${getErrorMessage(error)}`);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async (values: ReservationFormValues) => {
    setSaving(true);
    try {
      const staff = await syncRole();
      const payload = getReservationFields(values, staff);
      await createReservation(payload);
      messageApi.success("Reservación creada correctamente.");
      setModalOpen(false);
      form.resetFields();
      refreshData();
    } catch (error) {
      console.error("[ReservationsPage][handleSubmit] Error:", error);
      messageApi.error(
        `No se pudo crear la reservación: ${getErrorMessage(error)}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReservation = async (reservation: ExtendedReservation) => {
    if (reservation.id === undefined || reservation.id === null) return;
    try {
      await deleteReservation(reservation.id);
      messageApi.success("Reservación eliminada correctamente.");
      refreshData();
    } catch (error) {
      console.error("[ReservationsPage][handleDeleteReservation] Error:", error);
      messageApi.error(
        `No se pudo eliminar la reservación: ${getErrorMessage(error)}`,
      );
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
            onClick={() => void openCreateModal()}
            loading={spacesLoading}
          >
            Nueva reservación
          </Button>
        }
      >
        <ReservationTable
          reloadKey={reloadKey}
          onDelete={handleDeleteReservation}
        />
      </Card>

      <ReservationModalForm
        open={modalOpen}
        onCancel={closeModal}
        onFinish={handleSubmit}
        loading={saving}
        form={form}
        spaces={spaces}
        isStaff={isStaff}
      />
    </Flex>
  );
};

export default ReservationsPage;