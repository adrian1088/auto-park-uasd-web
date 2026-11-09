"use client";

import Descriptions from "@/app/components/Descriptions";
import type { CurrentUser } from "@/app/components/layout/HeaderUserSection";
import type { ParkingLot } from "@/app/lib/api/lots";
import { getParkingLots } from "@/app/lib/api/lots";
import type { Reservation } from "@/app/lib/api/reservations";
import { getReservations } from "@/app/lib/api/reservations";
import { getCurrentUser } from "@/app/lib/api/auth";
import { checkInTicket } from "@/app/lib/api/tickets";
import type { CheckInInput, Ticket } from "@/app/lib/api/tickets";
import type { Vehicle } from "@/app/lib/api/vehicles";
import { getVehicles } from "@/app/lib/api/vehicles";
import { formatDateTime, formatMoney } from "@/app/lib/utils/format";
import { HttpError } from "@/app/lib/http/http-client";
import { FileDoneOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Modal,
  QRCode,
  Radio,
  Select,
  Spin,
  Typography,
} from "antd";
import { useEffect, useState } from "react";

const { Title, Paragraph, Text } = Typography;
type EntryType = "SIN_RESERVACION" | "CON_RESERVACION";
type CheckInFields = {
  vehicleId?: number;
  parkingLotId?: number;
  reservationId?: number;
};

function getErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    const body = error.body;
    if (body && typeof body === "object" && "message" in body) {
      const message = body.message;
      if (typeof message === "string") return message;
      if (Array.isArray(message)) return message.join(", ");
    }
  }
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

const CheckInPage = () => {
  const [entryType, setEntryType] = useState<EntryType>("SIN_RESERVACION");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [currentReservations, setCurrentReservations] = useState<Reservation[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [optionsReload, setOptionsReload] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm<CheckInFields>();

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      setOptionsLoading(true);
      setOptionsError(null);
      try {
        if (entryType === "SIN_RESERVACION") {
          const [user, vehicleList, lotList] = await Promise.all([
            getCurrentUser(),
            getVehicles(),
            getParkingLots(),
          ]);
          if (!active) return;
          setCurrentUser(user);
          setVehicles(
            vehicleList.filter((vehicle) => vehicle.user?.id === user.id),
          );
          setParkingLots(lotList);
        } else {
          const reservationList = await getReservations();
          if (!active) return;
          const now = Date.now();
          setCurrentReservations(
            reservationList.filter(
              (reservation) =>
                reservation.vehicle &&
                new Date(reservation.startTime).getTime() <= now &&
                new Date(reservation.endTime).getTime() > now,
            ),
          );
        }
      } catch (error) {
        if (active) setOptionsError(getErrorMessage(error));
      } finally {
        if (active) setOptionsLoading(false);
      }
    };

    void loadOptions();
    return () => {
      active = false;
    };
  }, [entryType, optionsReload]);

  const handleSubmit = async (fields: CheckInFields) => {
    setActionError(null);
    let input: CheckInInput;
    if (entryType === "SIN_RESERVACION") {
      if (!currentUser || fields.vehicleId === undefined || fields.parkingLotId === undefined) {
        setActionError("Selecciona un vehículo y un estacionamiento antes de continuar.");
        return;
      }
      input = {
        vehicleId: fields.vehicleId,
        userId: currentUser.id,
        parkingLotId: fields.parkingLotId,
      };
    } else {
      if (fields.reservationId === undefined) {
        setActionError("Selecciona una reservación vigente antes de continuar.");
        return;
      }
      input = { reservationId: fields.reservationId };
    }

    setSubmitting(true);
    try {
      const createdTicket = await checkInTicket(input);
      setTicket(createdTicket);
      setIsModalVisible(true);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const switchEntryType = (nextType: EntryType) => {
    if (nextType === entryType) return;
    form.resetFields();
    setOptionsError(null);
    setActionError(null);
    setEntryType(nextType);
  };

  const canSubmit =
    !optionsLoading &&
    !optionsError &&
    (entryType === "SIN_RESERVACION"
      ? Boolean(currentUser && vehicles.length && parkingLots.length)
      : currentReservations.length > 0);

  return (
    <Flex
      justify="center"
      align="center"
      style={{ minHeight: "100vh", padding: "32px 16px" }}
    >
      <Card style={{ width: "100%", maxWidth: 680 }}>
        <Flex vertical gap={20}>
          <div>
            <Title level={1} style={{ margin: 0 }}>
              Registrar entrada
            </Title>
            <Paragraph style={{ margin: "8px 0 0", fontSize: 16 }}>
              Selecciona cómo se realizará el ingreso para generar un ticket.
            </Paragraph>
          </div>

          <Radio.Group
            value={entryType}
            onChange={(event) => switchEntryType(event.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="large"
            options={[
              { label: "Sin reservación", value: "SIN_RESERVACION" },
              { label: "Con reservación", value: "CON_RESERVACION" },
            ]}
          />

          {optionsError && (
            <Alert
              type="error"
              showIcon
              title="No se pudieron cargar los datos requeridos."
              description={optionsError}
              action={
                <Button
                  size="small"
                  onClick={() => setOptionsReload((value) => value + 1)}
                >
                  Reintentar
                </Button>
              }
            />
          )}
          {actionError && (
            <Alert
              type="error"
              showIcon
              title="No se pudo registrar la entrada."
              description={actionError}
            />
          )}

          <Spin spinning={optionsLoading}>
            <Form
              form={form}
              layout="vertical"
              onFinish={(fields) => void handleSubmit(fields)}
            >
              {entryType === "SIN_RESERVACION" ? (
                <>
                  <Form.Item
                    label="Vehículo / placa"
                    name="vehicleId"
                    rules={[{ required: true, message: "Selecciona un vehículo." }]}
                  >
                    <Select
                      size="large"
                      showSearch
                      optionFilterProp="label"
                      placeholder="Busca por placa"
                      options={vehicles.map((vehicle) => ({
                        value: vehicle.id,
                        label: `${vehicle.plateNumber} — ${vehicle.make} ${vehicle.model} (${vehicle.type})`,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Estacionamiento"
                    name="parkingLotId"
                    rules={[
                      {
                        required: true,
                        message: "Selecciona un estacionamiento.",
                      },
                    ]}
                  >
                    <Select
                      size="large"
                      placeholder="Selecciona un estacionamiento"
                      options={parkingLots.map((lot) => ({
                        value: lot.id,
                        label: lot.name,
                      }))}
                    />
                  </Form.Item>
                </>
              ) : (
                <Form.Item
                  label="Reservación vigente"
                  name="reservationId"
                  rules={[
                    {
                      required: true,
                      message: "Selecciona una reservación vigente.",
                    },
                  ]}
                >
                  <Select
                    size="large"
                    placeholder="Selecciona por ID de reservación"
                    options={currentReservations.map((reservation) => ({
                      value: reservation.id,
                      label: `#${reservation.id} — ${reservation.vehicle?.plateNumber ?? "Sin placa"} — hasta ${formatDateTime(reservation.endTime)}`,
                    }))}
                  />
                </Form.Item>
              )}

              {!optionsLoading &&
                !optionsError &&
                entryType === "SIN_RESERVACION" &&
                (!vehicles.length || !parkingLots.length) && (
                  <Alert
                    type="warning"
                    showIcon
                    title={
                      !vehicles.length
                        ? "No hay vehículos asociados a tu cuenta."
                        : "No hay estacionamientos disponibles."
                    }
                    style={{ marginBottom: 16 }}
                  />
                )}

              {!optionsLoading &&
                !optionsError &&
                entryType === "CON_RESERVACION" &&
                currentReservations.length === 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    title="No hay reservaciones vigentes con vehículo asignado."
                    style={{ marginBottom: 16 }}
                  />
                )}

              <Button
                block
                size="large"
                type="primary"
                htmlType="submit"
                icon={<FileDoneOutlined />}
                loading={submitting}
                disabled={!canSubmit}
              >
                Registrar entrada
              </Button>
            </Form>
          </Spin>
        </Flex>
      </Card>

      <Modal
        title="Ticket de estacionamiento"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsModalVisible(false)}>
            Cerrar
          </Button>,
        ]}
        destroyOnHidden
      >
        {ticket && (
          <Flex justify="center" align="center" vertical gap={16}>
            <Descriptions
              columns={2}
              items={[
                { key: "code", label: "Código", content: ticket.code },
                {
                  key: "plate",
                  label: "Placa",
                  content: ticket.vehicle?.plateNumber ?? "-",
                },
                {
                  key: "vehicleType",
                  label: "Tipo de vehículo",
                  content: ticket.vehicle?.type ?? "-",
                },
                {
                  key: "space",
                  label: "Espacio",
                  content: ticket.spot?.spaceNumber ?? "-",
                },
                {
                  key: "floor",
                  label: "Piso",
                  content: ticket.spot?.floor?.floorNumber ?? "-",
                },
                {
                  key: "entrance",
                  label: "Fecha de entrada",
                  content: formatDateTime(ticket.entranceAt),
                },
                {
                  key: "rate",
                  label: "Tarifa por hora",
                  content: formatMoney(ticket.rateAmount),
                },
              ]}
            />
            <QRCode value={ticket.code} />
            <Text copyable>{ticket.code}</Text>
          </Flex>
        )}
      </Modal>
    </Flex>
  );
};

export default CheckInPage;
