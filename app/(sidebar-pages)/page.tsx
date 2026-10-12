"use client";
import {
  Button,
  Card,
  Col,
  Flex,
  Row,
  Statistic,
  Table,
  TableProps,
  Tag,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";

const { Title, Paragraph } = Typography;

interface DataType {
  key: string;
  floor: string;
  totalSpace: number;
  occupied: number;
  available: number;
}

const columns: TableProps<DataType>['columns'] = [
  {
    title: 'Piso',
    dataIndex: 'floor',
    key: 'floor',
    render: (text) => <a>{text}</a>,
  },
  {
    title: 'Total Espacio',
    dataIndex: 'totalSpace',
    key: 'totalSpace',
  },
  {
    title: 'Ocupados',
    dataIndex: 'occupied',
    key: 'occupied',
  },
  {
    title: 'Disponibles',
    key: 'available',
    dataIndex: 'available',
  },
];

const data: DataType[] = [
  {
    key: "1",
    floor: "Piso 1",
    totalSpace: 32,
    occupied: 9,
    available: 23,
  },
  {
    key: "2",
    floor: "Piso 2",
    totalSpace: 42,
    occupied: 10,
    available: 32,
  },
  {
    key: "3",
    floor: "Piso 3",
    totalSpace: 32,
    occupied: 8,
    available: 24,
  },
];

const HomePage = () => {
  return (
    <Flex
      gap={16}
      flex={1}
      // justify="center"
      // align="center"
      // style={{ width: "100%", minHeight: "100vh", padding: 24 }}
      vertical
    >
      <Row gutter={16}>
        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="Disponibles"
              value={11}
              precision={0}
              styles={{
                content: { color: "#3f8600" },
                title: { fontSize: 20 },
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="Ocupados"
              value={9}
              precision={0}
              styles={{
                content: { color: "#cf1322" },
                title: { fontSize: 20 },
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="Reservados"
              value={9}
              precision={0}
              styles={{ content: { color: "#1890ff" }, title: { fontSize: 20 } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="Fuera de Servicio"
              value={9}
              precision={0}
              styles={{ content: { color: "#fa8c16" }, title: { fontSize: 20 } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={18}>
          <Card title="Ocupación del Parqueo" variant="borderless">
            <p>
              Aqui se mostraria grafico lineal que mostraria ocupacion mensual
              en porcentaje.
            </p>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Ocupación por Piso" variant="borderless">
            <p>
              Aqui se mostraria grafico de barras que mostraria otras
              estadisticas relevantes del parqueo.
            </p>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={18}>
          <Card title="Ocupación por Piso" variant="borderless">
            <Table<DataType> columns={columns} dataSource={data} />
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Metodos de Pago" variant="borderless">
            <p>Aqui se mostraria otras estadisticas relevantes del parqueo.</p>
          </Card>
        </Col>
      </Row>

      {/* <Card style={{ width: "100%", maxWidth: 760 }}>
        <Space size={16} style={{ width: "100%" }} vertical>
          <Title level={1} style={{ marginBottom: 0 }}>
            Welcome back José Maldonado
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Paragraph>

          <Space>
            <Button onClick={() => void onLogout()}>Logout</Button>
          </Space>
        </Space>
      </Card> */}
    </Flex>
  );
};

export default HomePage;
