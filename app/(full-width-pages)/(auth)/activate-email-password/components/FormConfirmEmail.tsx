import { DynamicForm, FieldConfig } from "@/app/components/form";

const FormConfirmEmail = ({ form, initialValues, onSubmit }: any) => {
  const fields: FieldConfig[] = [
    {
      name: "password",
      type: "password",
      rules: [
        {
          type: "string",
          message: "Por favor ingrese una contraseña válida",
        },
        {
          required: true,
          message: "Por favor ingrese su contraseña",
        },
      ],
      label: "Contraseña",
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

export default FormConfirmEmail;
