"use client";

import React, { useMemo, useState } from "react";
import type { ParkingSpace } from "@/app/lib/api/spaces";
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Divider,
  Flex,
  Form,
  Grid,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import type { FormInstance, FormProps } from "antd";
import dayjs from "dayjs";

const PRIMICIA_MINUTES = 25;

export type ReservationFormValues = {
  lotId?: number;
  floorId?: number;
  parkingSpaceId: number;
  vehiclePlateNumber?: string;
  startTime: dayjs.Dayjs;
  clientName?: string;
  clientEmail?: string;
};

type Props = {
  open: boolean;
  onCancel: () => void;
  onFinish: (values: ReservationFormValues) => void | Promise<void>;
  loading: boolean;
  form: FormInstance<ReservationFormValues>;
  spaces: ParkingSpace[];
  isStaff?: boolean;
};

const { useBreakpoint } = Grid;
const { Text } = Typography;

function logError(context: string, error: unknown) {
  console.error(`[ReservationModalForm][${context}] Error:`, error);
}

function getSpaceType(space: ParkingSpace): string {
  return String((space as { type?: unknown }).type ?? "").trim().toUpperCase();
}

export const ReservationModalForm = ({
  open,
  onCancel,
  onFinish,
  loading,
  form,
  spaces,
  isStaff = false,
}: Props) => {
  const screens = useBreakpoint();
  const isDesktop = Boolean(screens.md);
  const [compatibilityWarning, setCompatibilityWarning] = useState<string | null>(null);

  const lotId = Form.useWatch("lotId", form);
  const floorId = Form.useWatch("floorId", form);
  const parkingSpaceId = Form.useWatch("parkingSpaceId", form);

  const lots = useMemo(() => {
    try {
      const map = new Map<number, string>();
      for (const s of spaces ?? []) {
        if (s.floor?.lot) map.set(s.floor.lot.id, s.floor.lot.name);
      }
      return Array.from(map, ([value, label]) => ({ value, label }));
    } catch (error) {
      logError("lots", error);
      return [];
    }
  }, [spaces]);

  const floors = useMemo(() => {
    try {
      if (!lotId) return [];
      const map = new Map<number, string>();
      for (const s of spaces ?? []) {
        if (s.floor?.lot?.id === lotId) {
          map.set(s.floor.id, `Piso ${s.floor.floorNumber}`);
        }
      }
      return Array.from(map, ([value, label]) => ({ value, label }));
    } catch (error) {
      logError("floors", error);
      return [];
    }
  }, [spaces, lotId]);

  const spaceOptions = useMemo(() => {
    try {
      if (!lotId || !floorId) return [];
      return (spaces ?? [])
        .filter((s) => {
          const sameLocation = s.floor?.lot?.id === lotId && s.floor?.id === floorId;
          const rawStatus = String((s as { status?: unknown }).status ?? "FREE")
            .trim()
            .toUpperCase();
          const isFree =
            rawStatus === "FREE" ||
            rawStatus === "AVAILABLE" ||
            rawStatus === "LIBRE" ||
            rawStatus === "";
          return sameLocation && isFree;
        })
        .map((s) => {
          const sType = getSpaceType(s);
          return {
            value: s.id,
            label: sType
              ? `Espacio ${s.spaceNumber} (${sType})`
              : `Espacio ${s.spaceNumber}`,
          };
        });
    } catch (error) {
      logError("spaceOptions", error);
      return [];
    }
  }, [spaces, lotId, floorId]);

  const selectedSpace = useMemo(() => {
    if (!parkingSpaceId) return undefined;
    return (spaces ?? []).find((s) => s.id === parkingSpaceId);
  }, [spaces, parkingSpaceId]);

  const disabledArrivalDate = (current: dayjs.Dayjs) => {
    try {
      return Boolean(current && current.startOf("day").isBefore(dayjs().startOf("day")));
    } catch (error) {
      logError("disabledArrivalDate", error);
      return false;
    }
  };

  const disabledArrivalTime = (current: dayjs.Dayjs | null) => {
    try {
      const now = dayjs();
      if (!current || !current.isSame(now, "day")) {
        return {};
      }

      const currentHour = now.hour();
      const currentMinute = now.minute();

      return {
        disabledHours: () =>
          Array.from({ length: 24 }, (_, h) => h).filter((h) => h < currentHour),
        disabledMinutes: (selectedHour: number) =>
          selectedHour === currentHour
            ? Array.from({ length: 60 }, (_, m) => m).filter((m) => m < currentMinute)
            : [],
      };
    } catch (error) {
      logError("disabledArrivalTime", error);
      return {};
    }
  };

  const handleFormFinish = async (values: ReservationFormValues) => {
    try {
      await onFinish(values);
    } catch (error) {
      logError("onFinish", error);
    }
  };

  const handleFormFinishFailed: FormProps<ReservationFormValues>["onFinishFailed"] = (
    errorInfo,
  ) => {
    console.warn("[ReservationModalForm][onFinishFailed] Validación fallida:", errorInfo);
  };

  const handleModalCancel = () => {
    setCompatibilityWarning(null);
    try {
      onCancel();
    } catch (error) {
      logError("onCancel", error);
    }
  };

  return (
    <Modal
      title="Nueva reservación"
      open={open}
      onCancel={handleModalCancel}
      footer={null}
      destroyOnHidden
      closable={!loading}
      mask={{ closable: !loading }}
      width={isDesktop ? 720 : "100%"}
      styles={{
        body: {
          paddingTop: 6,
          paddingBottom: 2,
        },
      }}
    >
      <Form<ReservationFormValues>
        form={form}
        layout="vertical"
        size={isDesktop ? "middle" : "large"}
        onFinish={(values) => {
          void handleFormFinish(values);
        }}
        onFinishFailed={handleFormFinishFailed}
      >
        {isStaff ? (
          <>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
              DATOS DEL CLIENTE
            </Text>
            <Row gutter={isDesktop ? 16 : 0} style={{ marginTop: 6 }}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="clientName"
                  label="Nombre completo"
                  style={{ marginBottom: 12 }}
                  rules={[{ required: true, message: "Escribe el nombre." }]}
                >
                  <Input placeholder="Ej.: Juan Pérez" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="clientEmail"
                  label="Correo electrónico"
                  style={{ marginBottom: 12 }}
                  rules={[
                    { required: true, message: "Escribe el correo." },
                    { type: "email", message: "Correo no válido." },
                  ]}
                >
                  <Input placeholder="Ej.: cliente@correo.com" />
                </Form.Item>
              </Col>
            </Row>
            <Divider style={{ margin: "6px 0 12px" }} />
          </>
        ) : (
          <Alert
            title="Reservación a tu cuenta"
            description="Se registrará con los datos de tu sesión actual."
            type="info"
            showIcon
            style={{ marginBottom: 14 }}
          />
        )}

        <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
          UBICACIÓN Y ESPACIO
        </Text>
        <Row gutter={isDesktop ? 16 : 0} style={{ marginTop: 6 }}>
          <Col xs={24} md={8}>
            <Form.Item
              name="lotId"
              label="Parqueo"
              style={{ marginBottom: 12 }}
              rules={[{ required: true, message: "Selecciona un parqueo." }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Seleccionar parqueo"
                options={lots}
                onChange={() => {
                  try {
                    setCompatibilityWarning(null);
                    form.setFieldsValue({
                      floorId: undefined,
                      parkingSpaceId: undefined,
                    });
                  } catch (error) {
                    logError("lotId.onChange", error);
                  }
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="floorId"
              label="Piso / Nivel"
              style={{ marginBottom: 12 }}
              rules={[{ required: true, message: "Selecciona un piso." }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Seleccionar piso"
                disabled={!lotId}
                options={floors}
                onChange={() => {
                  try {
                    setCompatibilityWarning(null);
                    form.setFieldsValue({ parkingSpaceId: undefined });
                  } catch (error) {
                    logError("floorId.onChange", error);
                  }
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="parkingSpaceId"
              label="Espacio"
              style={{ marginBottom: 12 }}
              rules={[{ required: true, message: "Selecciona un espacio." }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Seleccionar espacio"
                disabled={!floorId}
                options={spaceOptions}
                onChange={() => {
                  setCompatibilityWarning(null);
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        {selectedSpace && getSpaceType(selectedSpace) && (
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
            Tipo de espacio seleccionado: <Text strong>{getSpaceType(selectedSpace)}</Text>
          </Text>
        )}

        <Divider style={{ margin: "6px 0 12px" }} />

        <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
          LLEGADA (PRIMICIA) Y VEHÍCULO
        </Text>
        <Row gutter={isDesktop ? 16 : 0} style={{ marginTop: 6 }}>
          <Col xs={24} md={12}>
            <Form.Item
              name="startTime"
              label="Fecha y hora de llegada (primicia)"
              style={{ marginBottom: 12 }}
              rules={[
                {
                  required: true,
                  message: "Selecciona la fecha y hora de llegada.",
                },
                {
                  validator(_, value: dayjs.Dayjs | undefined) {
                    try {
                      if (!value) return Promise.resolve();
                      if (value.isBefore(dayjs().subtract(1, "minute"))) {
                        return Promise.reject(
                          new Error(
                            "Solo se permiten fechas y horas presentes o futuras.",
                          ),
                        );
                      }
                      return Promise.resolve();
                    } catch (error) {
                      logError("startTime.validator", error);
                      return Promise.reject(
                        new Error("Error al validar la fecha de llegada."),
                      );
                    }
                  },
                },
              ]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                disabledDate={disabledArrivalDate}
                disabledTime={disabledArrivalTime}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="vehiclePlateNumber"
              label="Placa"
              style={{ marginBottom: 12 }}
              rules={[
                {
                  validator(_, value: string | undefined) {
                    try {
                      if (!value || !value.trim()) return Promise.resolve();
                      if (value.trim().length < 2) {
                        return Promise.reject(
                          new Error("Ingresa una matrícula válida."),
                        );
                      }
                      return Promise.resolve();
                    } catch (error) {
                      logError("vehiclePlateNumber.validator", error);
                      return Promise.reject(
                        new Error("Error al validar la matrícula."),
                      );
                    }
                  },
                },
              ]}
            >
              <Input placeholder="Ej.: A123456" maxLength={20} />
            </Form.Item>
          </Col>
        </Row>

        {compatibilityWarning && (
          <Alert
            type="error"
            showIcon
            style={{ marginTop: 4, marginBottom: 12 }}
            title="Incompatibilidad de espacio y vehículo detectada"
            description={compatibilityWarning}
          />
        )}

        <Alert
          type="info"
          showIcon
          style={{ marginTop: 4, marginBottom: 12 }}
          title={`Primicia automática de ${PRIMICIA_MINUTES} minutos`}
          description={`La hora fin se calcula automáticamente sumando ${PRIMICIA_MINUTES} minutos a la hora de llegada.`}
        />

        <Divider style={{ margin: "8px 0 14px" }} />

        <Flex justify="end">
          <Space>
            <Button onClick={handleModalCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Crear reservación
            </Button>
          </Space>
        </Flex>
      </Form>
    </Modal>
  );
};