"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, Row, Col, Statistic, Form, message, Flex, Space, Button, Input, Select } from "antd";
import {
  UserAddOutlined,
  UsergroupAddOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  PauseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import HeaderPage from "@/app/components/HeaderPage";
import { ReservationsService, User } from "@/app/lib/api/reservations";
import { getRates, Rate } from "@/app/lib/api/rates";
import { SubscriptionsService, Subscription } from "@/app/lib/api/subscriptions";
import { getParkingSpaces, ParkingSpace } from "@/app/lib/api/spaces";
import { getPaymentsPaginated, Payment } from "@/app/lib/api/payments";

import { SubscriptionsTable } from "./components/SubscriptionsTable";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { RenewModal } from "./components/RenewModal";
import { ClientHistoryModal } from "./components/ClientHistoryModal";

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  const [isRenewModalOpen, setIsRenewModalOpen] = useState<boolean>(false);
  const [renewingSub, setRenewingSub] = useState<Subscription | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [selectedSubForHistory, setSelectedSubForHistory] = useState<Subscription | null>(null);
  const [clientPayments, setClientPayments] = useState<Payment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);

  const [users, setUsers] = useState<User[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);

  const [form] = Form.useForm();
  const [renewForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, ratesData, spacesData, subsData] = await Promise.all([
        ReservationsService.getUsers(),
        getRates({ type: "MONTHLY" }),
        getParkingSpaces(),
        SubscriptionsService.findAll(),
      ]);
      setUsers(usersData);
      setRates(ratesData);
      setSpaces(spacesData || []);
      setSubscriptions(subsData || []);
    } catch {
      messageApi.error("No se pudieron sincronizar los datos con el backend.");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
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

  const openCreateModal = () => {
    setEditingSub(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (record: Subscription) => {
    setEditingSub(record);
    form.setFieldsValue({
      userId: record.userId,
      plateNumbers: record.plateNumbers || "",
      rateId: record.rateId,
      parkingSpaceId: record.parkingSpaceId,
    });
    setIsModalOpen(true);
  };

  const openRenewModal = (record: Subscription) => {
    setRenewingSub(record);
    renewForm.resetFields();
    renewForm.setFieldsValue({
      amount: record.rate?.amount || 3000,
      paymentMethod: "CASH",
    });
    setIsRenewModalOpen(true);
  };


  const openHistoryModal = async (record: Subscription) => {
    setSelectedSubForHistory(record);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      // Solicitamos los pagos recientes de caja
      const response = await getPaymentsPaginated({ page: 1, limit: 100 });
      let allPayments: Payment[] = [];
      
      if (Array.isArray(response)) {
        allPayments = response;
      } else if (response && typeof response === "object" && "data" in response && Array.isArray((response as { data: Payment[] }).data)) {
        allPayments = (response as { data: Payment[] }).data;
      }

      // Pasamos la lista completa de pagos al estado del modal
      setClientPayments(allPayments);
    } catch (err) {
      console.error("Error al obtener los pagos:", err);
      setClientPayments([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleConfirmRenewal = async (values: { amount: number; paymentMethod: string }) => {
    if (!renewingSub) return;
    setSubmitting(true);
    try {
      await SubscriptionsService.renew(renewingSub.id, Number(values.amount), values.paymentMethod);
      messageApi.success(`¡Pago de RD$ ${Number(values.amount).toFixed(2)} registrado en caja y suscripción renovada!`);
      setIsRenewModalOpen(false);
      setRenewingSub(null);
      void fetchData();
    } catch (error: unknown) {
      const err = error as { message?: string };
      messageApi.error(err?.message || "No se pudo procesar la renovación.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePause = async (record: Subscription) => {
    try {
      const newStatus = record.status === "PAUSED" ? "ACTIVE" : "PAUSED";
      await SubscriptionsService.update(record.id, { status: newStatus } as unknown as { status: "ACTIVE" | "EXPIRED" | "PAUSED" });
      messageApi.success(`Suscripción ${newStatus === "PAUSED" ? "pausada" : "reactivada"} en el servidor.`);
      void fetchData();
    } catch {
      messageApi.error("No se pudo cambiar el estado de la suscripción.");
    }
  };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const rawPlates = String(values.plateNumbers || "").toUpperCase().trim();
      
      const startDate = editingSub ? editingSub.startDate : dayjs().toISOString();
      const endDate = editingSub ? editingSub.endDate : dayjs().add(1, "month").toISOString();

      const payload = {
        userId: Number(values.userId),
        plateNumbers: rawPlates,
        rateId: Number(values.rateId),
        parkingSpaceId: values.parkingSpaceId ? Number(values.parkingSpaceId) : undefined,
        startDate,
        endDate,
      };

      if (editingSub) {
        await SubscriptionsService.update(editingSub.id, payload);
        messageApi.success("Cliente Fijo y Espacio 24/7 actualizados correctamente.");
      } else {
        const response = await SubscriptionsService.create(payload);
        messageApi.success("Cliente Fijo, Espacio 24/7 y Placas LPR registrados con éxito.");
        
        // 🔍 Notificación avanzada de diagnóstico para el correo
        if (response && (response as unknown as { emailSent?: boolean }).emailSent === false) {
          messageApi.warning("Aviso: La suscripción se creó, pero el correo electrónico con el QR NO pudo enviarse. Revisa la terminal del backend.", 7);
        } else {
          messageApi.info("Correo con el código QR enviado correctamente al cliente.", 5);
        }
      }

      setIsModalOpen(false);
      form.resetFields();
      void fetchData();
    } catch (error: unknown) {
      const err = error as { message?: string };
      messageApi.error(err?.message || "No se pudo guardar la suscripción.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubscription = async (id: number) => {
    try {
      await SubscriptionsService.remove(id);
      messageApi.success("Suscripción eliminada de la base de datos.");
      void fetchData();
    } catch {
      messageApi.error("No se pudo eliminar la suscripción.");
    }
  };

  const filteredSubscriptions = subscriptions.filter((item) => {
    const matchesSearch =
      item.user?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.plateNumbers || "").toLowerCase().includes(searchText.toLowerCase());

    const isExpired = item.status === "EXPIRED" || dayjs().isAfter(dayjs(item.endDate));
    const currentStatus = isExpired && item.status !== "PAUSED" ? "EXPIRED" : item.status;

    return matchesSearch && (statusFilter === "ALL" || currentStatus === statusFilter);
  });

  const totalCount = subscriptions.length;
  const activeCount = subscriptions.filter((s) => !dayjs().isAfter(dayjs(s.endDate)) && s.status === "ACTIVE").length;
  const expiredCount = subscriptions.filter((s) => (dayjs().isAfter(dayjs(s.endDate)) || s.status === "EXPIRED") && s.status !== "PAUSED").length;
  const pausedCount = subscriptions.filter((s) => s.status === "PAUSED").length;

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <HeaderPage
        title="Clientes Fijos (Abonados)"
        description="Gestión segura de suscripciones, asignación de espacios 24/7, control de cobros e integración LPR."
      />

      <Row justify="space-between" align="middle">
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              Actualizar
            </Button>
            <Button type="primary" icon={<UserAddOutlined />} onClick={openCreateModal}>
              Nuevo Cliente Fijo
            </Button>
          </Space>
        </Col>
      </Row>

      {/* KPI Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card variant="borderless">
            <Statistic title="Total Abonados" value={totalCount} prefix={<UsergroupAddOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card variant="borderless">
            <Statistic title="Activas (LPR OK)" value={activeCount} styles={{ content: { color: "#52c41a" } }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card variant="borderless">
            <Statistic title="Vencidas / Pendientes" value={expiredCount} styles={{ content: { color: "#ff4d4f" } }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card variant="borderless">
            <Statistic title="Pausadas" value={pausedCount} styles={{ content: { color: "#fa8c16" } }} prefix={<PauseCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Buscar por cliente o placa..."
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
                { label: "Activas", value: "ACTIVE" },
                { label: "Vencidas / Pendientes", value: "EXPIRED" },
                { label: "Pausadas", value: "PAUSED" },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Tabla Principal Modularizada */}
      <Card styles={{ body: { padding: 0 } }}>
        <SubscriptionsTable
          subscriptions={filteredSubscriptions}
          loading={loading}
          onRenew={openRenewModal}
          onHistory={openHistoryModal}
          onEdit={openEditModal}
          onTogglePause={handleTogglePause}
          onDelete={handleDeleteSubscription}
        />
      </Card>

      {/* Modales Modularizados */}
      <SubscriptionModal
        open={isModalOpen}
        editingSub={editingSub}
        users={users}
        rates={rates}
        spaces={spaces}
        submitting={submitting}
        form={form}
        onCancel={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <RenewModal
        open={isRenewModalOpen}
        renewingSub={renewingSub}
        submitting={submitting}
        form={renewForm}
        onCancel={() => setIsRenewModalOpen(false)}
        onSubmit={handleConfirmRenewal}
      />

      <ClientHistoryModal
        open={isHistoryModalOpen}
        selectedSub={selectedSubForHistory}
        payments={clientPayments}
        loading={loadingHistory}
        onCancel={() => setIsHistoryModalOpen(false)}
      />
    </Flex>
  );
};

export default SubscriptionsPage;