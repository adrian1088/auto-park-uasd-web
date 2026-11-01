import { DynamicForm, FieldConfig } from "@/app/components/form";
type FormForgotPasswordProps = {
  form: any;
  initialValues: Record<string, any>;
  disabled?: boolean;
  onSubmit: (values: Record<string, any>) => void;
};

const FormForgotPassword = ({
  form,
  initialValues,
  disabled = false,
  onSubmit,
}: FormForgotPasswordProps) => {
  const fields: FieldConfig[] = [
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
  ];

  return (
    <>
      <DynamicForm
        form={form}
        fields={fields}
        columns={1}
        size="large"
        gutter={2}
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

export default FormForgotPassword;
