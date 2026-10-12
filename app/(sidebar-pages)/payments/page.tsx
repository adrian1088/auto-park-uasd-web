"use client";
import { Flex, Typography } from "antd";

const { Title, Paragraph } = Typography;
const PaymentsPage = () => {
  return (
    <Flex vertical gap={16}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Pagos
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Manejar los pagos del sistema.
        </Paragraph>
      </div>
    </Flex>
  );
};

export default PaymentsPage;