/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Flex, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import HeaderPage from "@/app/components/HeaderPage";
import {
  getParkingSpaces,
  type ParkingSpace,
  type ParkingSpaceStatus,
} from "@/app/lib/api/spaces";
import { getTicketsPaginated, type Ticket } from "@/app/lib/api/tickets";
import {
  getPaymentsPaginated,
  type Payment,
  type PaymentMethod,
} from "@/app/lib/api/payments";
import {
  SubscriptionsService,
  type Subscription,
} from "@/app/lib/api/subscriptions";
import { getReservationsPaginated } from "@/app/lib/api/reservations";
import { DashboardQuickActions } from "./components/QuickActions";
import { DashboardKpis } from "./components/DashboardKpis";
import {
  DashboardFilters,
  type DateRangeFilter,
} from "./components/Filters";
import { DashboardChartsAndOccupancy } from "./components/ChartsAndOccupancy";
import { RecentActivityCard } from "./components/RecentActivityCard";
import { ParkingMapCard } from "./components/ParkingMapCard";

function isWithinRange(
  dateStr: string | undefined,
  range: DateRangeFilter,
): boolean {
  if (range === "ALL") return true;
  if (!dateStr) return false;
  const date = dayjs(dateStr);
  if (!date.isValid()) return false;

  if (range === "TODAY") {
    return date.isSame(dayjs(), "day");
  }
  if (range === "7D") {
    return date.isAfter(dayjs().subtract(7, "day"));
  }
  if (range === "MONTH") {
    return date.isSame(dayjs(), "month") && date.isSame(dayjs(), "year");
  }
  return true;
}

export default function DashboardPage() {
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [, setReservationsTotal] = useState<number>(0);

  const [dateRange, setDateRange] = useState<DateRangeFilter>("TODAY");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "ALL">(
    "ALL",
  );
  const [searchText, setSearchText] = useState("");

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [spacesRes, ticketsRes, paymentsRes, subsRes, reservationsRes] =
        await Promise.all([
          getParkingSpaces(),
          getTicketsPaginated({ page: 1, limit: 100 }),
          getPaymentsPaginated({ page: 1, limit: 100 }),
          SubscriptionsService.findAll(),
          getReservationsPaginated({ page: 1, limit: 1 }),
        ]);

      setSpaces(Array.isArray(spacesRes) ? spacesRes : []);
      setTickets(ticketsRes?.data ?? []);
      setPayments(paymentsRes?.data ?? []);
      setSubscriptions(Array.isArray(subsRes) ? subsRes : []);
      setReservationsTotal(reservationsRes?.meta?.total ?? 0);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      messageApi.error(
        "No se pudieron cargar todas las métricas del panel principal.",
      );
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const filteredPayments = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return payments.filter((payment) => {
      if (!isWithinRange(payment.date, dateRange)) return false;
      if (methodFilter !== "ALL" && payment.method !== methodFilter)
        return false;
      if (q) {
        const plate = (
          payment.ticket?.vehiclePlateNumber ||
          payment.ticket?.plateNumber ||
          ""
        ).toLowerCase();
        const space = (
          payment.ticket?.spaceNumber ||
          payment.ticket?.spot?.spaceNumber ||
          ""
        ).toLowerCase();
        const origin = (payment.originLabel || "").toLowerCase();
        if (!plate.includes(q) && !space.includes(q) && !origin.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [payments, dateRange, methodFilter, searchText]);

  const filteredTickets = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (!isWithinRange(ticket.entranceAt, dateRange)) return false;
      if (q) {
        const plate = (
          ticket.vehiclePlateNumber ||
          ticket.plateNumber ||
          ticket.vehicle?.plateNumber ||
          ""
        ).toLowerCase();
        const space = (
          ticket.spaceNumber ||
          ticket.spot?.spaceNumber ||
          ticket.spotNumber ||
          ""
        ).toLowerCase();
        if (!plate.includes(q) && !space.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, dateRange, searchText]);

  const spaceCountsByStatus = useMemo(() => {
    const counts: Record<ParkingSpaceStatus, number> = {
      FREE: 0,
      OCCUPIED: 0,
      RESERVED: 0,
      OUT_OF_SERVICE: 0,
    };
    for (const space of spaces) {
      if (space.status in counts) {
        counts[space.status] += 1;
      }
    }
    return counts;
  }, [spaces]);

  const revenueByMethod = useMemo(() => {
    const totals: Record<PaymentMethod, number> = {
      CASH: 0,
      CREDIT_CARD: 0,
      DEBIT_CARD: 0,
      PAYPAL: 0,
    };
    for (const payment of filteredPayments) {
      if (payment.method in totals) {
        totals[payment.method] += Number(payment.amount || 0);
      }
    }
    return totals;
  }, [filteredPayments]);

  const totalPeriodRevenue = useMemo(
    () =>
      filteredPayments.reduce((acc, item) => acc + Number(item.amount || 0), 0),
    [filteredPayments],
  );

  const activeTicketsCount = useMemo(
    () => tickets.filter((t) => t.status === "ACTIVE").length,
    [tickets],
  );

  const activeSubscriptionsCount = useMemo(
    () =>
      subscriptions.filter(
        (s) => !dayjs().isAfter(dayjs(s.endDate)) && s.status === "ACTIVE",
      ).length,
    [subscriptions],
  );

  return (
    <Flex vertical gap={14}>
      {contextHolder}

      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={12}>
        <HeaderPage title="Dashboard Operativo" />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => void loadDashboardData()}
          loading={loading}
        >
          Actualizar Panel
        </Button>
      </Flex>

      <DashboardQuickActions />

      <DashboardKpis
        loading={loading}
        totalSpaces={spaces.length}
        occupiedSpaces={spaceCountsByStatus.OCCUPIED}
        freeSpaces={spaceCountsByStatus.FREE}
        activeTicketsCount={activeTicketsCount}
        periodRevenue={totalPeriodRevenue}
        periodPaymentsCount={filteredPayments.length}
        activeSubscriptionsCount={activeSubscriptionsCount}
        totalSubscriptionsCount={subscriptions.length}
      />

      <ParkingMapCard refreshTrigger={refreshTrigger} />

      <DashboardFilters
        dateRange={dateRange}
        methodFilter={methodFilter}
        searchText={searchText}
        onDateRangeChange={setDateRange}
        onMethodFilterChange={setMethodFilter}
        onSearchTextChange={setSearchText}
        onClear={() => {
          setDateRange("TODAY");
          setMethodFilter("ALL");
          setSearchText("");
        }}
      />

      <DashboardChartsAndOccupancy
        loading={loading}
        revenueByMethod={revenueByMethod}
        totalPeriodRevenue={totalPeriodRevenue}
        spaceCountsByStatus={spaceCountsByStatus}
        totalSpaces={spaces.length}
      />

      <RecentActivityCard
        loading={loading}
        tickets={filteredTickets}
        payments={filteredPayments}
      />
    </Flex>
  );
}
