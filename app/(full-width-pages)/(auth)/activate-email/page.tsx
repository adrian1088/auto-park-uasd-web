"use client";

import { Button, Flex, Result, message } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { activateEmail } from "@/app/lib/api/auth";
import { getErrorMessage } from "@/app/lib/utils";
import { AppLogo } from "@/app/components/AppLogo";

const ActivateEmailPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [messageApi, contextHolder] = message.useMessage();
  const [activationStatus, setActivationStatus] = useState<
    "info" | "success" | "error"
  >("info");
  const handledHash = useRef<string | null | undefined>(undefined);
  const hashParam = searchParams.get("hash");
  const getTitle = (status: "info" | "success" | "error") => {
    switch (status) {
      case "info":
        return "Activando correo electrónico...";
      case "success":
        return "Correo Electrónico Confirmado";
      case "error":
        return "No se pudo activar el correo electrónico";
    }
  };
  const getSubTitle = (
    status: "info" | "success" | "error",
    message?: string,
  ) => {
    switch (status) {
      case "info":
        return "Espere mientras confirmamos su correo electrónico.";
      case "success":
        return "Su correo electrónico ha sido confirmado exitosamente. Ahora puede iniciar sesión.";
      case "error":
        return message ?? "Verifique el enlace e inténtelo de nuevo.";
    }
  };
  const isError = activationStatus === "error";
  const handleSubmit = useCallback(
    async (token: string) => {
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
      } catch (error: any) {
        setActivationStatus("error");
        const errorMsg = getErrorMessage(error);
        setErrorMessage(errorMsg);
        messageApi.error(
          `No se pudo activar el correo electrónico: ${errorMsg}`,
        );
      }
    },
    [messageApi, router],
  );

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
      <AppLogo />
      <Flex
        justify="center"
        align="center"
        gap={16}
        style={{ width: "100%" }}
        vertical
      >
        <Result
          status={activationStatus}
          title={getTitle(activationStatus)}
          subTitle={getSubTitle(activationStatus, errorMessage)}
          styles={{
            subTitle: {
              color: isError ? "red" : undefined,
            },
          }}
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
