"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/app/lib/api/auth";

import { Flex, Form, message, Button } from "antd";
import { FormChangePassword } from "./components/FormChangePassword";
import Image from "next/image";
import { Typography } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { getErrorMessage } from "@/app/lib/utils";

const { Title, Text } = Typography;

function getConfirmEmailFields(values: Record<string, unknown>) {
  const { password, confirmNewPassword } = values;
  if (!password) {
    throw new Error("La contraseña es obligatoria");
  }
  if (!confirmNewPassword) {
    throw new Error("La confirmación de la nueva contraseña es obligatoria");
  }
  if (password !== confirmNewPassword) {
    throw new Error("Las contraseñas no coinciden");
  }


  return {
    password: String(password),
  };
}

const PasswordChangePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hashParam = searchParams.get("hash");
  const expiresParam = searchParams.get("expires");

  const initialValues = { password: "", confirmNewPassword: "" };
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      if (!hashParam || hashParam.trim() === "") {
        throw new Error("Parámetros de hash o expiración faltantes");
      }
      
      const fields = getConfirmEmailFields(values);
      await resetPassword(hashParam, fields.password);
      messageApi.success("Contraseña cambiada exitosamente", 10, () => {
        router.push("/sign-in");
      });
    } catch (error) {
      messageApi.error(
        `Error al cambiar la contraseña: ${getErrorMessage(error)}`,
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
      <Title level={4}> Cambiar Contraseña</Title>
      <Text style={{ textAlign: "center" }} type="secondary">
        Por favor complete el formulario para cambiar su contraseña.
      </Text>
      {contextHolder}
      <FormChangePassword
        form={form}
        initialValues={initialValues}
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
          loading={isSubmitting}
          block
          onClick={() => form.submit()}
        >
          Cambiar Contraseña
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

export default PasswordChangePage;
