"use client";

import { Button, Flex, Result, message } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { activateEmail } from "@/app/lib/api/auth";
import { getErrorMessage } from "@/app/lib/utils";

const ActivateEmailPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [activationStatus, setActivationStatus] = useState<
    "info" | "success" | "error"
  >("info");
  const handledHash = useRef<string | null | undefined>(undefined);
  const hashParam = searchParams.get("hash");

  const handleSubmit = useCallback(async (token: string) => {
    try {
      await activateEmail({
        token,
      });
      setActivationStatus("success");
      messageApi.success(
        "Correo electrónico activado exitosamente.",
        10,
        () => {
          router.push("/sign-in");
        },
      );
    } catch (error: unknown) {
      setActivationStatus("error");
      messageApi.error(
        `No se pudo activar el correo electrónico: ${getErrorMessage(error)}`,
      );
    }
  }, [messageApi, router]);

  useEffect(() => {
    if (!hashParam) {
      if (handledHash.current === null) return;
      handledHash.current = null;
      setActivationStatus("error");
      messageApi.error("El enlace de activación es inválido.", 10);
      router.push("/sign-in");
      return;
    }

    if (handledHash.current === hashParam) return;
    handledHash.current = hashParam;
    void handleSubmit(hashParam);
  }, [handleSubmit, hashParam, messageApi, router]);

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        width: "100%",
        maxWidth: 600,
        margin: "0 auto",
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
        }}
      />
      <Flex
        justify="center"
        align="center"
        gap={16}
        style={{ width: "100%" }}
        vertical
      >
        <Result
          status={activationStatus}
          title={
            activationStatus === "info"
              ? "Activando correo electrónico..."
              : activationStatus === "success"
                ? "Correo Electrónico Confirmado"
                : "No se pudo activar el correo electrónico"
          }
          subTitle={
            activationStatus === "info"
              ? "Espere mientras confirmamos su correo electrónico."
              : activationStatus === "success"
                ? "Su correo electrónico ha sido confirmado exitosamente. Ahora puede iniciar sesión."
                : "Verifique el enlace e inténtelo de nuevo."
          }
          extra={[
            <Button
              key="sign-in"
              color="default"
              variant="link"
              onClick={() => {
                router.push("/sign-in");
              }}
            >
              <RollbackOutlined />
              Volver al inicio de sesión
            </Button>,
          ]}
        />
      </Flex>
      {contextHolder}
    </Flex>
  );
};

export default ActivateEmailPage;
