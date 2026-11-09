"use client";

import { Button, Flex, Form, Typography, message } from "antd";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { RollbackOutlined } from "@ant-design/icons";
import { useState } from "react";
import { getErrorMessage } from "@/app/lib/utils";
import { activateEmail } from "@/app/lib/api/auth";
import FormConfirmEmail from "./components/FormConfirmEmail";

const { Title, Text } = Typography;

function getConfirmEmailFields(values: Record<string, unknown>) {
  const { password } = values;

  return {
    password: String(password),
  };
}

const ActivateEmailPasswordPage = () => {
  const searchParams = useSearchParams();
  const hashParam = searchParams.get("hash");
  const router = useRouter();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialValues = { password: "" };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const fields = getConfirmEmailFields(values);
      await activateEmail({
        token: hashParam ?? "",
        password: fields.password,
      });
      messageApi.success("Correo electrónico activado exitosamente.", 10, () => {
        router.push("/sign-in");
      });
    } catch (error: any) {
      messageApi.error(
        `No se pudo activar el correo electrónico: ${getErrorMessage(error)}`,
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
      <Title level={4}>Activar Correo Electrónico</Title>
      <Text style={{ textAlign: "center" }} type="secondary">
        Por favor click en el botón para activar su correo electrónico, y
        activar su cuenta.
      </Text>
      <FormConfirmEmail
        form={form}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitting={isSubmitting}
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
          block
          onClick={() => handleSubmit(form.getFieldsValue())}
          loading={isSubmitting}
        >
          Activar Correo Electrónico
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

export default ActivateEmailPasswordPage;
