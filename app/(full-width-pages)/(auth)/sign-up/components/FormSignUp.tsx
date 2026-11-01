"use client";

import { DynamicForm, FieldConfig } from "@/app/components/form";
import { FormInstance } from "antd";

type FormSignUpProps = {
  form: FormInstance;
  disabled?: boolean;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
};

const FormSignUp = ({
  form,
  initialValues,
  onSubmit,
  disabled = false,
}: FormSignUpProps) => {
  const fields: FieldConfig[] = [
    {
      name: "name",
      type: "text",
      rules: [
        {
          required: true,
          message: "Por favor ingrese su nombre completo",
        },
        {
          min: 3,
          message: "El nombre completo debe tener al menos 3 caracteres",
        },
        {
          max: 100,
          message: "El nombre completo no debe exceder los 100 caracteres",
        },
      ],
      label: "Nombre completo",
    },
    {
      name: "email",
      type: "text",
      rules: [
        {
          type: "email",
          message: "Por favor ingrese un correo electrónico válido",
        },
        {
          required: true,
          message: "Por favor ingrese su correo electrónico",
        },
        {
          max: 200,
          message: "El correo electrónico no debe exceder los 200 caracteres",
        },
      ],
      label: "Correo electrónico",
    },
    {
      name: "phone",
      type: "text",
      label: "Teléfono",
      rules: [
        {
          required: true,
          message: "Por favor ingrese su teléfono",
        },
        {
          pattern: /^(809|829|849)[0-9]{7}$/,
          message:
            "Ingrese un teléfono dominicano válido que inicie con 809, 829 o 849",
        },
        {
          len: 10,
          message: "El teléfono debe tener exactamente 10 dígitos",
        },
      ],
    },
    {
      name: "password",
      type: "password",
      label: "Contraseña",
      rules: [
        {
          required: true,
          message: "Por favor ingrese su contraseña",
        },
        {
          min: 8,
          message: "La contraseña debe tener al menos 8 caracteres",
        },
        {
          max: 100,
          message: "La contraseña no debe exceder los 100 caracteres",
        },
      ],
    },
  ];

  return (
    <>
      <DynamicForm
        form={form}
        fields={fields}
        columns={1}
        size="large"
        gutter={0}
        initialValues={initialValues}
        onSubmit={onSubmit}
        disabled={disabled}
        styles={{
          root: { marginBottom: 16, width: "100%" },
          label: { height: 23, paddingBottom: 0, marginBottom: 0 },
          content: { marginBottom: 0, paddingBottom: 0 },
        }}
        hideActions
      />
    </>
  );
};

export default FormSignUp;
