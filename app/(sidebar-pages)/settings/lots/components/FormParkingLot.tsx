"use client";

import type { FormInstance } from "antd";
import { DynamicForm, type FieldConfig } from "@/app/components/form";

const fields: FieldConfig[] = [
  {
    name: "name",
    label: "Nombre",
    type: "text",
    required: true,
    rules: [{ max: 255, message: "El nombre no puede superar 255 caracteres." }],
    props: { maxLength: 255 },
  },
  {
    name: "address",
    label: "Dirección",
    type: "text",
    required: true,
    rules: [
      { max: 255, message: "La dirección no puede superar 255 caracteres." },
    ],
    props: { maxLength: 255 },
    span: 24,
  },
  {
    name: "capacity",
    label: "Capacidad (espacios)",
    type: "number",
    required: true,
    rules: [
      {
        type: "number",
        min: 1,
        message: "La capacidad debe ser al menos 1.",
      },
    ],
    props: { min: 1, precision: 0 },
  },
];

type Props = {
  form: FormInstance;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
};

const FormParkingLot = ({ form, initialValues, onSubmit }: Props) => (
  <DynamicForm
    form={form}
    fields={fields}
    columns={2}
    initialValues={initialValues}
    onSubmit={onSubmit}
    hideActions
  />
);

export default FormParkingLot;
