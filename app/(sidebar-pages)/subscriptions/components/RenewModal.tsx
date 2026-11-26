"use client";

import React from "react";
import { Modal, Form, Input, Select, Typography, Space, Button, FormInstance } from "antd";
import { Subscription } from "@/app/lib/api/subscriptions";

const { Text } = Typography;

interface RenewModalProps {
  open: boolean;
  renewingSub: Subscription | null;
  submitting: boolean;
  form: FormInstance;
  onCancel: () => void;
  onSubmit: (values: { amount: number; paymentMethod: string }) => Promise<void>;
}

export const RenewModal: React.FC<RenewModalProps> = ({
  open,
  renewingSub,
  submitting,
  form,
  onCancel,
  onSubmit,
}) => {
  return (
    <Modal
      title={`Registrar Pago y Renovar - ${renewingSub?.user?.name || ""}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 16 }}>
        <Form.Item name="amount" label="Monto a Cobrar (RD$)" rules={[{ required: true, message: "Ingresa el monto" }]}>
          <Input type="number" prefix="RD$" />
        </Form.Item>

        <Form.Item name="paymentMethod" label="Método de Pago" rules={[{ required: true, message: "Selecciona el método" }]}>
          <Select
            options={[
              { label: "Efectivo", value: "CASH" },
              { label: "Tarjeta de Crédito", value: "CREDIT_CARD" },
              { label: "Tarjeta de Débito", value: "DEBIT_CARD" },
              { label: "Transferencia / PayPal", value: "PAYPAL" },
            ]}
          />
        </Form.Item>

        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          * Al confirmar este cobro, el dinero ingresará de inmediato a la caja del día y extenderá la vigencia por 30 días adicionales.
        </Text>

        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={onCancel}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Confirmar Pago y Extender Plan
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};