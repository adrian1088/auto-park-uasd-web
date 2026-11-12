"use client";

import React from "react";
import { Modal, Form, Select, DatePicker, Button, Space, Alert } from "antd";
import type { FormInstance } from "antd";
import dayjs from "dayjs";
import { User } from "@/app/lib/api/reservations";

interface Props {
  open: boolean;
  onCancel: () => void;
  onFinish: (values: { entryTime: dayjs.Dayjs; userId: number }) => void;
  loading: boolean;
  form: FormInstance;
  users: User[];
}

export const ReservationModalForm: React.FC<Props> = ({
  open,
  onCancel,
  onFinish,
  loading,
  form,
  users,
}) => {
  return (
    <Modal
      title="Crear Nueva Reservación y Envío de QR"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="userId"
          label="Usuario / Cliente"
          rules={[{ required: true, message: "Selecciona un cliente" }]}
        >
          <Select
            showSearch
            placeholder="Seleccionar cliente registrado"
            optionFilterProp="children"
            options={users.map((u) => ({
              label: `${u.name} (${u.email})`,
              value: u.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="entryTime"
          label="Fecha y Hora Estimada de Entrada"
          rules={[
            { required: true, message: "Selecciona la hora de llegada" },
          ]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: "100%" }}
            placeholder="Seleccionar fecha y hora de llegada"
          />
        </Form.Item>

        <Alert
          title="Asignación Dinámica al Llegar"
          description="Al confirmar esta reserva se enviará un código QR único al correo del cliente. El número de espacio físico se asignará de manera automática en la entrada al momento de su llegada."
          type="info"
          showIcon
          style={{ marginBottom: 20, borderRadius: "6px" }}
        />

        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={onCancel}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Confirmar y Enviar QR
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};