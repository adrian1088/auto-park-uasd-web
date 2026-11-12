"use client";

import React, { useState, useCallback } from "react";
import { Button, Space, Modal, Card, Row, Col, Typography, Input, Select, message, Form } from "antd";
import { PlusOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { ReservationsService, Reservation, User } from "@/app/lib/api/reservations";
import { ReservationKPIs } from "./components/ReservationKPIs";
import { ReservationTable } from "./components/ReservationTable";
import { ReservationModalForm } from "./components/ReservationModalForm";

const { Title, Paragraph } = Typography;

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false);

  const [users, setUsers] = useState<User[]>([]);

  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reservationsData, usersData] = await Promise.all([
        ReservationsService.getAll(),
        ReservationsService.getUsers(),
      ]);
      setReservations(reservationsData);
      setUsers(usersData);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const errMsg = error.response?.data?.message || "Error al cargar los datos";
      message.error(Array.isArray(errMsg) ? errMsg.join(", ") : errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

// Carga inicial al montar el componente
  React.useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        void fetchData();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fetchData]);
  

const handleCreateReservation = async (values: {
    entryTime: dayjs.Dayjs;
    userId: number;
  }) => {
    setIsSubmitLoading(true);
    try {
      const entryTime = values.entryTime;
      const endTime = dayjs(entryTime).add(2, "hour");

      const payload = {
        startTime: entryTime.toISOString(),
        endTime: endTime.toISOString(),
        userId: values.userId,
      };

      await ReservationsService.createConfirmed(payload);
      message.success("¡Reserva creada con éxito! Se ha enviado el código QR al correo del cliente.");
      setIsCreateModalOpen(false);
      form.resetFields();
      void fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const errMsg = error.response?.data?.message || "No se pudo registrar la reservación";
      message.error(Array.isArray(errMsg) ? errMsg.join(", ") : errMsg);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleCancelReservation = async (id: number) => {
    Modal.confirm({
      title: "¿Deseas cancelar esta reservación?",
      content: "El cupo lógico será liberado de inmediato.",
      okText: "Sí, cancelar",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await ReservationsService.remove(id);
          message.success("Reservación cancelada correctamente");
          void fetchData();
        } catch {
          message.error("No se pudo cancelar la reserva");
        }
      },
    });
  };

  const filteredReservations = reservations.filter((item) => {
    const matchesSearch =
      item.user?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.id.toString().includes(searchText);

    const currentStatus = item.status || "CONFIRMED";
    const isExpired =
      currentStatus === "CONFIRMED" &&
      dayjs().isAfter(dayjs(item.startTime).add(20, "minute"));

    const finalStatus = isExpired ? "NO_SHOW" : currentStatus;
    return matchesSearch && (statusFilter === "ALL" || finalStatus === statusFilter);
  });

  const totalCount = reservations.length;
  const confirmedCount = reservations.filter(
    (r) =>
      (r.status || "CONFIRMED") === "CONFIRMED" &&
      !dayjs().isAfter(dayjs(r.startTime).add(20, "minute")),
  ).length;
  const completedCount = reservations.filter((r) => r.status === "COMPLETED").length;
  const cancelledCount = reservations.filter(
    (r) =>
      r.status === "CANCELLED" ||
      r.status === "NO_SHOW" ||
      ((r.status || "CONFIRMED") === "CONFIRMED" &&
        dayjs().isAfter(dayjs(r.startTime).add(20, "minute"))),
  ).length;

  return (
    <div style={{ padding: "4px" }}>
      {/* Encabezado */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Reservaciones</Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Gestión administrativa de reservaciones presenciales y confirmadas.
          </Paragraph>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void fetchData()}>Actualizar</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
              Nueva Reserva
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Tarjetas KPI */}
      <ReservationKPIs
        totalCount={totalCount}
        confirmedCount={confirmedCount}
        completedCount={completedCount}
        cancelledCount={cancelledCount}
      />

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Buscar por usuario o código..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { label: "Todos los Estados", value: "ALL" },
                { label: "Confirmadas (Por Llegar)", value: "CONFIRMED" },
                { label: "En Parqueo (COMPLETED)", value: "COMPLETED" },
                { label: "Canceladas / No Se Presentó", value: "CANCELLED" },
                { label: "Tolerancia Vencida (NO_SHOW)", value: "NO_SHOW" },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Tabla de Resultados */}
      <ReservationTable
        data={filteredReservations}
        loading={loading}
        onCancel={(id) => void handleCancelReservation(id)}
      />

      {/* Formulario Modal */}
      <ReservationModalForm
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onFinish={(values) => void handleCreateReservation(values)}
        loading={isSubmitLoading}
        form={form}
        users={users}
      />
    </div>
  );
}