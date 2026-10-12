"use client";
import { Flex, Typography } from "antd";
const { Title, Paragraph } = Typography;

const ReservationsPage = () => {
  return (
   <Flex vertical gap={16}>
    <div>
        <Title level={3} style={{ margin: 0 }}>
          Reservaciones
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Manejar las reservaciones del sistema.
        </Paragraph>
      </div>
   </Flex>
  );
};

export default ReservationsPage;