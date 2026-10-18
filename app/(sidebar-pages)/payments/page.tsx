"use client";

import { Button, Card, Flex, Form, message, Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import HeaderPage from "@/app/components/HeaderPage";
import {
  createPayment,
  getPayment,
  updatePayment,
} from "@/app/lib/api/payments";
import type {
  Payment,
  PaymentFields,
  PaymentFilters,
  PaymentMethod,
} from "@/app/lib/api/payments";
import DataTablePayment from "./components/DataTablePayment";
import FilterPayment from "./components/FilterPayment";
import FormPayment from "./components/FormPayment";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function getPaymentFields(values: Record<string, unknown>): PaymentFields {
  if (typeof values.ticketId !== "number") {
    throw new Error("El ticket es obligatorio.");
  }
  if (typeof values.amount !== "number") {
    throw new Error("El monto es obligatorio.");
  }
  if (typeof values.paymentMethod !== "string") {
    throw new Error("El método de pago es obligatorio.");
  }

  return {
    ticketId: values.ticketId,
    amount: values.amount,
    paymentMethod: values.paymentMethod as PaymentMethod,
  };
}

const PaymentsPage = () => {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const openCreateModal = () => {
    form.resetFields();
    setMode("create");
    setSelectedPayment(null);
    setModalOpen(true);
  };

  const openEditModal = async (id: number) => {
    try {
      const payment = await getPayment(id);
      form.resetFields();
      form.setFieldsValue({
        ticketId: payment.ticket.id,
        amount: Number(payment.amount),
        paymentMethod: payment.method,
      });
      setMode("edit");
      setSelectedPayment(payment);
      setModalOpen(true);
    } catch (error) {
      messageApi.error(`No se pudo cargar el pago: ${getErrorMessage(error)}`);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setSelectedPayment(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const paymentFields = getPaymentFields(values);
      if (mode === "create") {
        await createPayment(paymentFields);
        messageApi.success("Pago creado correctamente.");
      } else {
        if (!selectedPayment) {
          throw new Error("No se seleccionó un pago para editar.");
        }
        await updatePayment(selectedPayment.id, paymentFields);
        messageApi.success("Pago actualizado correctamente.");
      }
      setModalOpen(false);
      setSelectedPayment(null);
      form.resetFields();
      setReloadKey((key) => key + 1);
    } catch (error) {
      messageApi.error(`No se pudo guardar el pago: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <HeaderPage title="Pagos" description="Manejar los pagos del sistema." />

      <Card
        title="Todos los pagos"
        styles={{ body: { padding: 0 } }}
        extra={
          <Flex gap={8} wrap>
            <FilterPayment value={filters} onChange={setFilters} />
            <Button type="primary" onClick={openCreateModal}>
              <PlusOutlined />
              Registrar Pago
            </Button>
          </Flex>
        }
      >
        <DataTablePayment
          filters={filters}
          reloadKey={reloadKey}
          onEdit={openEditModal}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={mode === "edit" ? "Editar Pago" : "Registrar Pago"}
        okText="Guardar cambios"
        cancelText="Cancelar"
        confirmLoading={saving}
        onCancel={closeModal}
        onOk={() => {
          void form.submit();
        }}
        destroyOnHidden
      >
        <FormPayment
          form={form}
          initialValues={
            selectedPayment
              ? {
                  ticketId: selectedPayment.ticket.id,
                  amount: Number(selectedPayment.amount),
                  paymentMethod: selectedPayment.method,
                }
              : undefined
          }
          onSubmit={handleSubmit}
        />
      </Modal>
    </Flex>
  );
};

export default PaymentsPage;
