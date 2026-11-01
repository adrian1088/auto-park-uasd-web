import { DynamicForm, FieldConfig } from "@/app/components/form";

type FormForgotPasswordProps = {
  form: any;
  initialValues: Record<string, any>;
  disabled?: boolean;
  onSubmit: (values: Record<string, any>) => void;
};

export const FormChangePassword = ({
  form,
  initialValues,
  disabled,
  onSubmit,
}: FormForgotPasswordProps) => {
  const validateConfirmPassword = (_: any, value: string) => {
    if (!value || value === form.getFieldValue("newPassword")) {
      return Promise.resolve();
    }
    return Promise.reject(new Error("Las contraseñas no coinciden"));
  };

  const fields: FieldConfig[] = [
    {
      label: "Nueva Contraseña",
      name: "newPassword",
      type: "password",
      rules: [
        { required: true, message: "Por favor ingrese su nueva contraseña" },
        { min: 8, message: "La contraseña debe tener al menos 8 caracteres" },
      ],
    },
    {
      label: "Confirmar Nueva Contraseña",
      name: "confirmNewPassword",
      type: "password",
      rules: [
        { required: true, message: "Por favor confirme su nueva contraseña" },
        {
          validator: validateConfirmPassword,
        },
      ],
    },
  ];

  return (
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
  );
};
