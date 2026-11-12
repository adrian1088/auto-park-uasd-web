"use client";

import React from "react";
import { Card, Col, Flex, Row, Statistic, Table, TableProps} from "antd";


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
  { key: "1", floor: "Piso 1", totalSpace: 32, occupied: 9, available: 23 },
  { key: "2", floor: "Piso 2", totalSpace: 42, occupied: 10, available: 32 },
  { key: "3", floor: "Piso 3", totalSpace: 32, occupied: 8, available: 24 },
];

export default function HomePage() {
  return (
    <Flex gap={16} flex={1} vertical>
      <Row gutter={16}>
        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="Espacios Disponibles"
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
              title="Espacios Ocupados"
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
              title="Espacios Reservados"
              value={9}
              precision={0}
              styles={{ content: { color: "#1890ff" }, title: { fontSize: 20 } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="Espacios Fuera de Servicio"
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
            <p>Aquí se mostraría gráfico lineal que mostraría ocupación mensual en porcentaje.</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Ocupación por Piso" variant="borderless">
            <p>Aquí se mostraría gráfico de barras que mostraría otras estadísticas relevantes del parqueo.</p>
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
          <Card title="Métodos de Pago" variant="borderless">
            <p>Aquí se mostrarían otras estadísticas relevantes del parqueo.</p>
          </Card>
        </Col>
      </Row>
    </Flex>
  );
}
