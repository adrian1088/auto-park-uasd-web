"use client";

import { Button, Flex, Form, message, Typography } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import Image from "next/image";
import FormForgotPassword from "./components/FormForgotPassword";
import { useState } from "react";
import { forgotPassword } from "@/app/lib/api/auth";
import { getErrorMessage } from "@/app/lib/utils";

const { Title, Text } = Typography;

function getForgotPasswordRequestFields(values: any) {
  if (!values.email) {
    throw new Error("El correo electrónico es obligatorio");
  }
  return {
    email: values.email,
  };
}
const ForgotPasswordPage = () => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const fields = getForgotPasswordRequestFields(values);
      await forgotPassword(fields.email);
      messageApi.success(
        "Se ha enviado un correo para recuperar la contraseña",
        10,
      );
      form.resetFields();
    } catch (error: any) {
      messageApi.error(
        `No se pudo enviar el correo: ${getErrorMessage(error)}`,
        10,
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
      <Image
        src="/images/logo.png"
        alt="Auto Park UASD"
        width={855}
        height={247}
        style={{
          width: "100%",
          maxWidth: 300,
          height: "auto",
          marginBottom: 44,
        }}
      />
      <Title level={4}>Recuperar Contraseña</Title>
      <Text style={{ textAlign: "center" }} type="secondary">
        Por favor complete el formulario para recuperar su contraseña.
      </Text>
      {contextHolder}
      <FormForgotPassword
        form={form}
        initialValues={{ email: "" }}
        disabled={isSubmitting}
        onSubmit={onSubmit}
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
          loading={isSubmitting}
          block
          onClick={() => form.submit()}
        >
          Recuperar Contraseña
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
    </Flex>
  );
};

export default ForgotPasswordPage;
