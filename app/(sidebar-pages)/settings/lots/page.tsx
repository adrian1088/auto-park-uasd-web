"use client";

import HeaderPage from "@/app/components/HeaderPage";
import { Flex, message } from "antd";

const LotsPage = () => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <HeaderPage
        title="Localidades"
        description="Manejar las localidades de estacionamiento."
      />
    </Flex>
  );
};

export default LotsPage;
