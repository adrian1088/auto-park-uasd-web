"use client";

import { Form, type FormInstance } from "antd";
import { DynamicForm, type FieldConfig } from "@/app/components/form";

const baseFields: FieldConfig[] = [
  { name: "name", label: "Nombre", type: "text", required: true },
  {
    name: "email",
    label: "Correo",
    type: "text",
    required: true,
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
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
};

const FormUser = ({ form, initialValues, onSubmit }: Props) => {
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
export default FormUser;
