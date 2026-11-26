"use client";

import React from "react";
import { Modal, Space, Card, Row, Col, Statistic, Typography, Spin, List, Avatar, Tag, Button } from "antd";
import {
  HistoryOutlined,
  CheckCircleFilled,
  CreditCardOutlined,
  CalendarOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Subscription } from "@/app/lib/api/subscriptions";
import { Payment } from "@/app/lib/api/payments";
import { formatMoney, formatDateTime } from "@/app/lib/utils/format";

const { Text, Title } = Typography;

interface ClientHistoryModalProps {
  open: boolean;
  selectedSub: Subscription | null;
  payments: Payment[];
  loading: boolean;
  onCancel: () => void;
}

export const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({
  open,
  selectedSub,
  payments,
  loading,
  onCancel,
}) => {
  // 🚀 Filtro ultra-robusto validando ID de usuario y Correo Electrónico por seguridad
  const clientPayments = payments.filter((p) => {
    if (!selectedSub) return false;

    const pAny = p as unknown as { 
      userId?: number; 
      user_id?: number;
      user?: { id?: number; email?: string };
    };

    const paymentUserId = pAny.userId || pAny.user_id || pAny.user?.id;
    const paymentEmail = pAny.user?.email;

    const matchesId = paymentUserId && selectedSub.userId && Number(paymentUserId) === Number(selectedSub.userId);
    const matchesEmail = paymentEmail && selectedSub.user?.email && paymentEmail.toLowerCase() === selectedSub.user.email.toLowerCase();

    return matchesId || matchesEmail;
  });

  const totalHistoricalPayments = clientPayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const lastPayment = clientPayments.length > 0 ? clientPayments[0] : null;

  const getMethodLabel = (method?: string) => {
    switch (String(method || "").toUpperCase()) {
      case "CASH":
        return "Efectivo";
      case "CREDIT_CARD":
        return "Tarjeta de Crédito";
      case "DEBIT_CARD":
        return "Tarjeta de Débito";
      case "PAYPAL":
      case "TRANSFER":
        return "Transferencia / Digital";
      default:
        return method || "Efectivo";
    }
  };

  return (
    <Modal
      title={
        <Space size={10} style={{ padding: "4px 0" }}>
          <div
            style={{
              backgroundColor: "#e0f2fe",
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HistoryOutlined style={{ color: "#0284c7", fontSize: 20 }} />
          </div>
          <div>
            <Title level={5} style={{ margin: 0, color: "#0f172a" }}>
              Historial Financiero y Transacciones
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Cliente: <Text strong>{selectedSub?.user?.name || "Abonado General"}</Text> ({selectedSub?.user?.email || "Sin correo"})
            </Text>
          </div>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" type="primary" onClick={onCancel} style={{ borderRadius: "6px", paddingInline: 24 }}>
          Cerrar Historial
        </Button>,
      ]}
      width={760}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        <div style={{ padding: "8px 0" }}>
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={12}>
              <Card
                style={{ borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}
                styles={{ body: { padding: "16px 20px" } }}
              >
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 13 }}>Total Acumulado Histórico</Text>}
                  value={totalHistoricalPayments}
                  precision={2}
                  formatter={(value) => formatMoney(Number(value))}
                  styles={{ content: { color: "#16a34a", fontWeight: 700, fontSize: "22px" } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card
                style={{ borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}
                styles={{ body: { padding: "16px 20px" } }}
              >
                <Statistic
                  title={<Text type="secondary" style={{ fontSize: 13 }}>Transacciones Exitosas</Text>}
                  value={clientPayments.length}
                  styles={{ content: { color: "#0284c7", fontWeight: 700, fontSize: "22px" } }}
                  prefix={<CheckCircleFilled style={{ color: "#0284c7", fontSize: 18, marginRight: 4 }} />}
                />
              </Card>
            </Col>
          </Row>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text strong style={{ fontSize: "15px", color: "#1e293b" }}>
              Desglose Detallado de Pagos
            </Text>
            {lastPayment && (
              <Tag color="cyan" style={{ borderRadius: "4px", padding: "2px 8px" }}>
                Último pago: {formatDateTime((lastPayment as unknown as { createdAt?: string; date?: string }).createdAt || (lastPayment as unknown as { date?: string }).date || new Date().toISOString())}
              </Tag>
            )}
          </div>

          {clientPayments.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 36, background: "#fafafa", borderRadius: 10, border: "1px dashed #cbd5e1" }}>
              <CreditCardOutlined style={{ fontSize: 36, color: "#94a3b8", marginBottom: 8 }} />
              <Text type="secondary" style={{ display: "block", fontSize: 14 }}>
                No hay pagos registrados para este cliente.
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                El primer pago se registra automáticamente al crear o renovar la suscripción.
              </Text>
            </Card>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={clientPayments}
              style={{ maxHeight: 340, overflowY: "auto", paddingRight: 4 }}
              renderItem={(item: Payment, index) => {
                const itemAny = item as unknown as {
                  id: number;
                  amount: number;
                  paymentMethod?: string;
                  method?: string;
                  createdAt?: string;
                  date?: string;
                  ticketId?: number;
                };
                const payDate = itemAny.createdAt || itemAny.date || new Date().toISOString();
                const payMethod = itemAny.paymentMethod || itemAny.method || "CASH";

                return (
                  <List.Item
                    style={{
                      padding: "14px 16px",
                      border: "1px solid #f1f5f9",
                      background: "#ffffff",
                      borderRadius: 8,
                      marginBottom: 10,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<CreditCardOutlined />}
                          style={{ backgroundColor: "#f0fdf4", color: "#16a34a", verticalAlign: "middle" }}
                          size={40}
                        />
                      }
                      title={
                        <Space size={8}>
                          <Text strong style={{ fontSize: 14, color: "#0f172a" }}>
                            Transacción #{itemAny.id || index + 1}
                          </Text>
                          <Tag color="success" style={{ borderRadius: "12px", fontSize: 11, fontWeight: 600 }}>
                            Completado
                          </Tag>
                          {itemAny.ticketId && (
                            <Tag color="processing" style={{ borderRadius: "4px", fontSize: 10 }}>
                              Ticket #{itemAny.ticketId}
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={2} style={{ marginTop: 4 }}>
                          <Space size={12}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <TagOutlined style={{ marginRight: 4 }} />
                              Método: <Text strong>{getMethodLabel(payMethod)}</Text>
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              {formatDateTime(payDate)}
                            </Text>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Concepto: Suscripción / Espacio Exclusivo 24/7 (AutoPark UASD)
                          </Text>
                        </Space>
                      }
                    />
                    <div style={{ textAlign: "right", minWidth: 100 }}>
                      <Text strong style={{ fontSize: "17px", color: "#16a34a" }}>
                        {formatMoney(Number(itemAny.amount))}
                      </Text>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </Spin>
    </Modal>
  );
};