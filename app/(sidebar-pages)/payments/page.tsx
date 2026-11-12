"use client";

import { Card, Flex, Row, Col, Statistic, message, Button } from "antd";
import { 
  DollarOutlined, 
  CreditCardOutlined, 
  RiseOutlined, 
  CalendarOutlined, 
  BarChartOutlined, 
  FileTextOutlined 
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
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

const PaymentsPage = () => {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const reloadKey = 0; // Sin setter no usado

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
  const [allPaymentsForReport, setAllPaymentsForReport] = useState<Payment[]>([]);

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    let active = true;

    const fetchMetricsData = async () => {
      try {
        const response = await getPaymentsPaginated({ page: 1, limit: 50, ...filters });
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
          if (paymentDate.isSame(now, "month") && paymentDate.isSame(now, "year")) {
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
    <Flex vertical gap={16}>
      {contextHolder}
      
      <Flex justify="space-between" align="center" wrap gap={8}>
        <HeaderPage
          title="Gestión de Caja y Analítica Financiera"
          description="Control de cobros de tickets, ingresos por suscripciones y reportes de rendimiento por periodos (Semanal, Mensual, Semestral y Anual)."
        />
        <Button 
          type="primary" 
          icon={<FileTextOutlined />} 
          size="large"
          onClick={handleOpenReport}
          style={{ borderRadius: "6px", backgroundColor: "#0958d9" }}
        >
          Generar Reporte Detallado
        </Button>
      </Flex>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless" style={{ background: "#f6ffed", border: "1px solid #b7eb8f" }}>
            <Statistic
              title="Caja de Hoy (Diario)"
              value={todayRevenue}
              precision={2}
              prefix={<CalendarOutlined />}
              styles={{ content: { color: "#3f8600" } }}
              formatter={(val) => `RD$ ${Number(val).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless" style={{ background: "#e6f4ff", border: "1px solid #91caff" }}>
            <Statistic
              title="Ingresos de la Semana (7 days)"
              value={weekRevenue}
              precision={2}
              prefix={<RiseOutlined />}
              styles={{ content: { color: "#1677ff" } }}
              formatter={(val) => `RD$ ${Number(val).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless" style={{ background: "#fff7e6", border: "1px solid #ffd591" }}>
            <Statistic
              title="Ingresos del Mes Actual"
              value={monthRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              styles={{ content: { color: "#fa8c16" } }}
              formatter={(val) => `RD$ ${Number(val).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless">
            <Statistic
              title="Últimos 6 Meses (Semestral)"
              value={semesterRevenue}
              precision={2}
              prefix={<BarChartOutlined />}
              formatter={(val) => `RD$ ${Number(val).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless">
            <Statistic
              title="Acumulado del Año Actual"
              value={yearRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              styles={{ content: { color: "#531dab" } }}
              formatter={(val) => `RD$ ${Number(val).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless">
            <Statistic
              title="Método Preferido / Transacciones"
              value={topMethod}
              suffix={`(${totalTransactions} tks)`}
              prefix={<CreditCardOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Historial de Cobros y Auditoría Financiera"
        styles={{ body: { padding: 0 } }}
        extra={
          <Flex gap={8} wrap>
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