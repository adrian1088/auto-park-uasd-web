"use client";

import { Form, type FormInstance } from "antd";
import { DynamicForm, type FieldConfig } from "@/app/components/form";
import { paymentMethodLabels } from "./DataTablePayment";

export const paymentMethodOptions = Object.entries(paymentMethodLabels).map(
  ([value, label]) => ({ value, label }),
);

const baseFields: FieldConfig[] = [
  {
    name: "ticketId",
    label: "ID del ticket",
    type: "number",
    required: true,
    props: { min: 1, precision: 0 },
  },
  {
    name: "amount",
    label: "Monto",
    type: "number",
    required: true,
    props: { min: 0.01, max: 99999999.99, precision: 2 },
  },
  {
    name: "paymentMethod",
    label: "Método de pago",
    type: "select",
    required: true,
    span: 24,
    options: paymentMethodOptions,
  },
];

type Props = {
  form: FormInstance;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
};

const FormPayment = ({ form, initialValues, onSubmit }: Props) => {
  return (
    <DynamicForm
      form={form}
      fields={baseFields}
      columns={2}
      initialValues={initialValues}
      onSubmit={onSubmit}
      hideActions
    />
  );
};

export { Form };
export default FormPayment;
