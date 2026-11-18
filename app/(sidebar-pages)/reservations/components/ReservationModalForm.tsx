"use client";

import type { ParkingSpace } from "@/app/lib/api/spaces";
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
} from "antd";
import type { FormInstance } from "antd";
import type dayjs from "dayjs";

type ReservationFormValues = {
  startTime: dayjs.Dayjs;
  endTime: dayjs.Dayjs;
  parkingSpaceId: number;
  vehiclePlateNumber?: string;
};

type Props = {
  open: boolean;
  onCancel: () => void;
  onFinish: (values: ReservationFormValues) => void | Promise<void>;
  loading: boolean;
  form: FormInstance<ReservationFormValues>;
  spaces: ParkingSpace[];
};

export const ReservationModalForm = ({
  open,
  onCancel,
  onFinish,
  loading,
  form,
  spaces,
}: Props) => {
  return (
    <Modal
      title="Crear reservación"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      closable={!loading}
      maskClosable={!loading}
    >
      <Form<ReservationFormValues>
        form={form}
        layout="vertical"
        onFinish={(values) => void onFinish(values)}
      >
        <Form.Item
          name="parkingSpaceId"
          label="Espacio de estacionamiento"
          rules={[{ required: true, message: "Selecciona un espacio." }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Selecciona un espacio"
            options={spaces.map((space) => ({
              value: space.id,
              label: `${space.floor.lot.name} · Piso ${space.floor.floorNumber} · Espacio ${space.spaceNumber}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="vehiclePlateNumber"
          label="Placa del vehículo"
          extra="Opcional"
        >
          <Input placeholder="Ej.: A123456" maxLength={20} />
        </Form.Item>

        <Form.Item
          name="startTime"
          label="Inicio"
          rules={[{ required: true, message: "Selecciona la fecha de inicio." }]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          name="endTime"
          label="Fin"
          dependencies={["startTime"]}
          rules={[
            { required: true, message: "Selecciona la fecha de fin." },
            ({ getFieldValue }) => ({
              validator(_, value: dayjs.Dayjs | undefined) {
                const startTime = getFieldValue("startTime") as
                  | dayjs.Dayjs
                  | undefined;
                if (!value || !startTime || value.isAfter(startTime)) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("La fecha de fin debe ser posterior al inicio."),
                );
              },
            }),
          ]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Alert
          title="Usuario autenticado"
          description="La reservación se registra para la cuenta con la que iniciaste sesión."
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />

        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Crear reservación
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
