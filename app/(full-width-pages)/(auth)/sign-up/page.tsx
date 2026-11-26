"use client";

import { Flex, Form, Typography, Button, message } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import FormSignUp from "./components/FormSignUp";
import { useState } from "react";
import { register, SignUpFields } from "@/app/lib/api/auth";
import { getErrorMessage } from "@/app/lib/utils";
import { AppLogo } from "@/app/components/AppLogo";

const { Title, Text } = Typography;

function getSignUpFields(values: Record<string, unknown>): SignUpFields {
  const { name, email, phone, password } = values;
  if (typeof name !== "string" || !name) {
    throw new Error("El nombre es obligatorio.");
  }
  if (typeof email !== "string" || !email) {
    throw new Error("El correo electrónico es obligatorio.");
  }
  if (!phone) {
    throw new Error("El teléfono es obligatorio.");
  }
  if (typeof password !== "string" || !password) {
    throw new Error("La contraseña debe ser una cadena de texto.");
  }
  return {
    name,
    email,
    phone: Number(phone),
    password,
  };
}
const SignUpPage = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleSubmit = async (values: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const fields = getSignUpFields(values);
      await register(fields);
      messageApi.success(
        "Cuenta registrada exitosamente, por favor revise su correo para activar la cuenta.",
        10,
        () => {
          router.push("/sign-in");
        },
      );
      form.resetFields();
    } catch (error: any) {
      messageApi.error(
        `No se pudo registrar la cuenta: ${getErrorMessage(error)}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        width: "100%",
        maxWidth: 380,
        margin: "0 auto",
        padding: "0 24px",
      }}
      vertical
    >
      <AppLogo />
      <Title level={4}>Registrar Cuenta</Title>
      <Text style={{ textAlign: "center" }} type="secondary">
        Por favor complete el formulario para crear una cuenta.
      </Text>
      <FormSignUp
        form={form}
        initialValues={{ name: "", email: "", phone: "", password: "" }}
        onSubmit={handleSubmit}
        disabled={isSubmitting}
      />
      <Flex
        justify="center"
        align="center"
        gap={16}
        style={{ width: "100%" }}
        vertical
      >
        <Button
          size="large"
          type="primary"
          disabled={isSubmitting}
          block
          onClick={() => form.submit()}
          loading={isSubmitting}
        >
          Registrarse
        </Button>
        <Button
          color="default"
          variant="link"
          onClick={() => {
            window.location.href = "/sign-in";
          }}
        >
          <RollbackOutlined />
          Volver al inicio de sesión
        </Button>
      </Flex>
      {contextHolder}
    </Flex>
  );
};

export default SignUpPage;
