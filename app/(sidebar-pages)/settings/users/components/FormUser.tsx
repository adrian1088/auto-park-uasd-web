"use client";

import { type FormInstance } from "antd";
import { DynamicForm, type FieldConfig } from "@/app/components/form";

const baseFields: FieldConfig[] = [
  { name: "name", label: "Nombre", type: "text", required: true, span: 24 },
  {
    name: "email",
    label: "Correo",
    type: "text",
    required: true,
    span: 24,
    rules: [{ type: "email", message: "Correo inválido" }],
  },
  { name: "phone", label: "Teléfono", type: "text", required: true },
  {
    name: "role",
    label: "Rol",
    type: "select",
    required: true,
    options: [
      { label: "Administrador", value: "admin" },
      { label: "Usuario", value: "user" },
    ],
  },
  { name: "active", label: "Activo", type: "switch" },
];

type Props = {
  form: FormInstance;
  initialValues?: Record<string, unknown>;
  mode?: "create" | "edit";
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
};

const FormUser = ({ form, initialValues, onSubmit, mode }: Props) => {
  const fields =
    mode === "create"
      ? baseFields.filter((field) => field.name !== "active")
      : baseFields;
  return (
    <DynamicForm
      form={form}
      fields={fields}
      columns={2}
      initialValues={initialValues}
      onSubmit={onSubmit}
      hideActions
    />
  );
};

export default FormUser;