"use client";

import { Card, Flex, Row, Col, Statistic, message, Button } from "antd";
import {
  DollarOutlined,
  CreditCardOutlined,
  RiseOutlined,
  CalendarOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import HeaderPage from "@/app/components/HeaderPage";
import { getPaymentsPaginated } from "@/app/lib/api/payments";
import type { Payment, PaymentFilters } from "@/app/lib/api/payments";
import DataTablePayment from "./components/DataTablePayment";
import FilterPayment from "./components/FilterPayment";
import { FinancialReportModal } from "./components/FinancialReportModal";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

const statCardBaseStyle: React.CSSProperties = {
  borderRadius: "10px",
};

const statBodyStyle: React.CSSProperties = {
  padding: "12px 16px",
};

const statTitleStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#64748b",
  marginBottom: 2,
};

const PaymentsPage = () => {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Estados para métricas profesionales de caja y periodos temporales
  const [todayRevenue, setTodayRevenue] = useState<number>(0);
  const [weekRevenue, setWeekRevenue] = useState<number>(0);
  const [monthRevenue, setMonthRevenue] = useState<number>(0);
  const [semesterRevenue, setSemesterRevenue] = useState<number>(0);
  const [yearRevenue, setYearRevenue] = useState<number>(0);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [topMethod, setTopMethod] = useState<string>("N/A");

  // Estados para el Modal de Reporte Financiero Detallado
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [allPaymentsForReport, setAllPaymentsForReport] = useState<Payment[]>(
    [],
  );

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    let active = true;

    const fetchMetricsData = async () => {
      try {
        const response = await getPaymentsPaginated({
          page: 1,
          limit: 50,
          ...filters,
        });
        if (!active) return;

        const paymentsList: Payment[] = response.data || [];
        const now = dayjs();
        const todayStr = now.format("YYYY-MM-DD");

        let todaySum = 0;
        let weekSum = 0;
        let monthSum = 0;
        let semesterSum = 0;
        let yearSum = 0;

        const methodCounts: Record<string, number> = {};

        paymentsList.forEach((p) => {
          const amount = Number(p.amount || 0);
          const paymentDate = p.date ? dayjs(p.date) : now;
          const dateStr = paymentDate.format("YYYY-MM-DD");

          if (dateStr === todayStr) {
            todaySum += amount;
          }
          if (paymentDate.isAfter(now.subtract(7, "day").startOf("day"))) {
            weekSum += amount;
          }
          if (
            paymentDate.isSame(now, "month") &&
            paymentDate.isSame(now, "year")
          ) {
            monthSum += amount;
          }
          if (paymentDate.isAfter(now.subtract(6, "month").startOf("day"))) {
            semesterSum += amount;
          }
          if (paymentDate.isSame(now, "year")) {
            yearSum += amount;
          }

          if (p.method) {
            methodCounts[p.method] = (methodCounts[p.method] || 0) + 1;
          }
        });

        let favoriteMethod = "N/A";
        let maxCount = -1;
        const methodLabels: Record<string, string> = {
          CASH: "Efectivo",
          CREDIT_CARD: "Tarjeta de Crédito",
          DEBIT_CARD: "Tarjeta de Débito",
          PAYPAL: "PayPal",
        };

        Object.entries(methodCounts).forEach(([m, count]) => {
          if (count > maxCount) {
            maxCount = count;
            favoriteMethod = methodLabels[m] || m;
          }
        });

        setTodayRevenue(todaySum);
        setWeekRevenue(weekSum);
        setMonthRevenue(monthSum);
        setSemesterRevenue(semesterSum);
        setYearRevenue(yearSum);
        setTotalTransactions(response.meta?.total || paymentsList.length);
        setTopMethod(favoriteMethod);
      } catch (_err) {
        console.error("Error al calcular estadísticas financieras:", _err);
      }
    };

    void fetchMetricsData();
    return () => {
      active = false;
    };
  }, [filters, reloadKey]);

  const handleAdminAudit = async (id: number) => {
    try {
      messageApi.info(`Consultando detalles de la transacción ID: ${id}`);
    } catch (error) {
      messageApi.error(`Error al auditar el pago: ${getErrorMessage(error)}`);
    }
  };

  const handleOpenReport = async () => {
    try {
      const res = await getPaymentsPaginated({ page: 1, limit: 50 });
      setAllPaymentsForReport(res.data || []);
      setIsReportModalOpen(true);
    } catch (_err) {
      messageApi.error("No se pudo generar el reporte detallado.");
    }
  };

  return (
    <Flex vertical gap={14} style={{ fontSize: "13px" }}>
      {contextHolder}

      <Flex vertical gap={10} align="flex-start">
        <HeaderPage
          title="Gestión de Caja y Analítica Financiera"
          description="Control de cobros de tickets, ingresos por suscripciones y reportes de rendimiento por periodos (Semanal, Mensual, Semestral y Anual)."
        />
        <Flex gap={8} wrap="wrap" align="center" justify="flex-start">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => setReloadKey((k) => k + 1)}
            style={{ borderRadius: "6px", fontSize: "13px" }}
          >
            Refrescar Vista
          </Button>
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={handleOpenReport}
            style={{
              borderRadius: "6px",
              backgroundColor: "#0958d9",
              fontSize: "13px",
            }}
          >
            Generar Reporte Detallado
          </Button>
        </Flex>
      </Flex>

      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={8}>
          <Card
            variant="borderless"
            styles={{ body: statBodyStyle }}
            style={{
              ...statCardBaseStyle,
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
            }}
          >
            <Statistic
              title={<span style={statTitleStyle}>Caja de Hoy (Diario)</span>}
              value={todayRevenue}
              precision={2}
              prefix={<CalendarOutlined style={{ fontSize: "15px" }} />}
              styles={{
                content: { color: "#3f8600", fontSize: "18px", fontWeight: 600 },
              }}
              formatter={(val) =>
                `RD$ ${Number(val).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            variant="borderless"
            styles={{ body: statBodyStyle }}
            style={{
              ...statCardBaseStyle,
              background: "#e6f4ff",
              border: "1px solid #91caff",
            }}
          >
            <Statistic
              title={
                <span style={statTitleStyle}>Ingresos de la Semana (7 days)</span>
              }
              value={weekRevenue}
              precision={2}
              prefix={<RiseOutlined style={{ fontSize: "15px" }} />}
              styles={{
                content: { color: "#1677ff", fontSize: "18px", fontWeight: 600 },
              }}
              formatter={(val) =>
                `RD$ ${Number(val).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            variant="borderless"
            styles={{ body: statBodyStyle }}
            style={{
              ...statCardBaseStyle,
              background: "#fff7e6",
              border: "1px solid #ffd591",
            }}
          >
            <Statistic
              title={<span style={statTitleStyle}>Ingresos del Mes Actual</span>}
              value={monthRevenue}
              precision={2}
              prefix={<DollarOutlined style={{ fontSize: "15px" }} />}
              styles={{
                content: { color: "#fa8c16", fontSize: "18px", fontWeight: 600 },
              }}
              formatter={(val) =>
                `RD$ ${Number(val).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={8}>
          <Card
            variant="borderless"
            styles={{ body: statBodyStyle }}
            style={{
              ...statCardBaseStyle,
              border: "1px solid #e2e8f0",
            }}
          >
            <Statistic
              title={
                <span style={statTitleStyle}>Últimos 6 Meses (Semestral)</span>
              }
              value={semesterRevenue}
              precision={2}
              prefix={<BarChartOutlined style={{ fontSize: "15px" }} />}
              styles={{
                content: { fontSize: "18px", fontWeight: 600 },
              }}
              formatter={(val) =>
                `RD$ ${Number(val).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            variant="borderless"
            styles={{ body: statBodyStyle }}
            style={{
              ...statCardBaseStyle,
              border: "1px solid #e2e8f0",
            }}
          >
            <Statistic
              title={<span style={statTitleStyle}>Acumulado del Año Actual</span>}
              value={yearRevenue}
              precision={2}
              prefix={<DollarOutlined style={{ fontSize: "15px" }} />}
              styles={{
                content: { color: "#531dab", fontSize: "18px", fontWeight: 600 },
              }}
              formatter={(val) =>
                `RD$ ${Number(val).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            variant="borderless"
            styles={{ body: statBodyStyle }}
            style={{
              ...statCardBaseStyle,
              border: "1px solid #e2e8f0",
            }}
          >
            <Statistic
              title={
                <span style={statTitleStyle}>
                  Método Preferido / Transacciones
                </span>
              }
              value={topMethod}
              suffix={
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  ({totalTransactions} tks)
                </span>
              }
              prefix={<CreditCardOutlined style={{ fontSize: "15px" }} />}
              styles={{
                content: { fontSize: "18px", fontWeight: 600 },
              }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span style={{ fontSize: "14px", fontWeight: 600 }}>
            Historial de Cobros y Auditoría Financiera
          </span>
        }
        style={{ borderRadius: "10px", border: "1px solid #e2e8f0" }}
        styles={{ body: { padding: "4px 0 8px 0" } }}
        extra={
          <Flex gap={8} wrap="wrap">
            <FilterPayment value={filters} onChange={setFilters} />
          </Flex>
        }
      >
        <DataTablePayment
          filters={filters}
          reloadKey={reloadKey}
          onEdit={handleAdminAudit}
        />
      </Card>

      <FinancialReportModal
        open={isReportModalOpen}
        payments={allPaymentsForReport}
        onClose={() => setIsReportModalOpen(false)}
      />
    </Flex>
  );
};

export default PaymentsPage;