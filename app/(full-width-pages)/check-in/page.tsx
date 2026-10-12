"use client";
import Descriptions, { DescriptionsProps } from "@/app/components/Descriptions";
import { FileDoneOutlined } from "@ant-design/icons";
import {
  Button,
  Divider,
  // Descriptions,
  // DescriptionsProps,
  Flex,
  Form,
  Input,
  Modal,
  QRCode,
  Radio,
  Typography,
} from "antd";
import { useState } from "react";
const { Title, Paragraph, Text } = Typography;

const CheckInPage = () => {
  const [entryType, setEntryType] = useState<
    "SIN_RESERVACION" | "CON_RESERVACION"
  >("SIN_RESERVACION");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const isWithoutReservation = entryType === "SIN_RESERVACION";
  const isWithReservation = entryType === "CON_RESERVACION";

  // Información del ticket
  const items: DescriptionsProps["items"] = [
    {
      key: "1",
      label: "Placa",
      content: "ABC-1234",
    },
    {
      key: "2",
      label: "Tipo de Vehiculo",
      content: "Carro",
    },
    {
      key: "3",
      label: "Piso",
      content: "2",
    },
    {
      key: "4",
      label: "Espacio",
      content: "A12",
    },
    {
      key: "5",
      label: "Fecha de Entrada",
      content: "2024-06-15 08:30 AM",
    },
  ];

  return (
    <Flex
      flex="1"
      justify="center"
      align="center"
      style={{
        minHeight: "100vh",
      }}
      vertical
    >
      <Title level={1} style={{ margin: 0 }}>
        Registrar Entrada
      </Title>
      <Paragraph style={{ marginBottom: "24px", fontSize: "16px" }}>
        Por favor, complete la información a continuación para registrar su
        entrada.
      </Paragraph>

      <Flex
        justify="center"
        align="center"
        style={{ gap: "24px", minWidth: "580px" }}
        vertical
      >
        <Flex style={{ gap: "16px" }}>
          <Button
            size="large"
            type={entryType === "SIN_RESERVACION" ? "primary" : "default"}
            onClick={() => setEntryType("SIN_RESERVACION")}
          >
            Sin Reservación
          </Button>
          <Button
            size="large"
            type={entryType === "CON_RESERVACION" ? "primary" : "default"}
            onClick={() => setEntryType("CON_RESERVACION")}
          >
            Con Reservación
          </Button>
        </Flex>

        <Flex style={{ gap: "16px", width: "100%" }} vertical>
          {/* Sin Reservación */}
          {isWithoutReservation && (
            <Form layout="vertical">
              <Form.Item label="Placa">
                <Input
                  type="text"
                  size="large"
                  placeholder="Ingrese la placa del vehiculo"
                />
              </Form.Item>
              {/* <Form.Item label="Tipo de Vehiculo">
            <Select
              size="large"
              placeholder="Seleccione el tipo de vehiculo"
              options={[
                { value: "CAR", label: "Carro" },
                { value: "SUV", label: "Jeepeta" },
                { value: "PICKUP", label: "Camioneta" },
                { value: "VAN", label: "Van" },
                { value: "BUS", label: "Bus" },
                { value: "MOTORCYCLE", label: "Motocicleta" },
                { value: "TRUCK", label: "Camion" },
              ]}
            />
          </Form.Item> */}
              <Form.Item label="Tipo de Vehiculo">
                <Radio.Group name="vehicleType" defaultValue="CAR" size="large">
                  <Radio.Button value="CAR">Carro</Radio.Button>
                  <Radio.Button value="SUV">Jeepeta</Radio.Button>
                  <Radio.Button value="PICKUP">Camioneta</Radio.Button>
                  <Radio.Button value="VAN">Van</Radio.Button>
                  <Radio.Button value="BUS">Bus</Radio.Button>
                  <Radio.Button value="MOTORCYCLE">Motocicleta</Radio.Button>
                  <Radio.Button value="TRUCK">Camion</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Form>
          )}

          {/* Con Reservación */}
          {isWithReservation && (
            <Form layout="vertical">
              <Form.Item label="Codigo Reservación">
                <Input
                  type="text"
                  size="large"
                  placeholder="Ingrese el codigo de la reservación"
                />
              </Form.Item>
            </Form>
          )}
        </Flex>

        <Button
          size="large"
          type="primary"
          onClick={() => setIsModalVisible(true)}
        >
          <FileDoneOutlined />
          Obtener Ticket
        </Button>
      </Flex>

      <Modal
        title="Auto Park Ticket"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        styles={{
          title: {
            marginBottom: "24px",
            textAlign: "center",
            fontSize: "24px",
          },
        }}
        destroyOnHidden
      >
        <Flex
          justify="center"
          align="center"
          style={{ width: "100%" }}
          vertical
        >
          <Descriptions
            columns={2}
            items={items}
            styleItem={{ marginBottom: "18px" }}
          />
          <QRCode value={"123456789"} />
          <Paragraph>123456789</Paragraph>
        </Flex>
      </Modal>
    </Flex>
  );
};

export default CheckInPage;
