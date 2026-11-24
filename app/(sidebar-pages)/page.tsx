/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Flex, message, Row, Select, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import HeaderPage from "@/app/components/HeaderPage";
import { getParkingLots, type ParkingLot } from "@/app/lib/api/lots";
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
import { DashboardKpis } from "../components/dashboard/DashboardKpis";
import {
  DashboardFilters,
  type DateRangeFilter,
} from "../components/dashboard/Filters";
import { DashboardChartsAndOccupancy } from "../components/dashboard/ChartsAndOccupancy";
import { RecentActivityCard } from "../components/dashboard/RecentActivityCard";
import { ParkingMapCard } from "../components/dashboard/ParkingMapCard";
import { OperationalSummaryCard } from "../components/dashboard/OperationalSummaryCard";

type PaymentWithFallbackDates = Payment & {
  createdAt?: string;
  paidAt?: string;
};

type TicketWithFallbackDates = Ticket & {
  createdAt?: string;
};

function resolvePaymentDate(
  payment: PaymentWithFallbackDates,
): string | undefined {
  return payment.date || payment.paidAt || payment.createdAt;
}

function resolveTicketDate(ticket: TicketWithFallbackDates): string | undefined {
  return ticket.entranceAt || ticket.createdAt;
}

function isWithinRange(
  dateStr: string | undefined,
  range: DateRangeFilter,
): boolean {
  if (range === "ALL") return true;
  if (!dateStr) return false;
  const date = dayjs(dateStr);
  if (!date.isValid()) return false;

  const now = dayjs();

  if (range === "TODAY") {
    return date.isSame(now, "day");
  }
  if (range === "7D") {
    const startOf7DaysAgo = now.subtract(6, "day").startOf("day");
    return !date.isBefore(startOf7DaysAgo);
  }
  if (range === "MONTH") {
    return date.isSame(now, "month") && date.isSame(now, "year");
  }
  return true;
}

function getItemLotId(item: unknown): number | undefined {
  if (!item || typeof item !== "object") return undefined;
  const rec = item as Record<string, unknown>;

  const direct =
    rec.lotId ??
    rec.parkingLotId ??
    (rec.lot as Record<string, unknown> | undefined)?.id ??
    (rec.parkingLot as Record<string, unknown> | undefined)?.id;

  if (direct !== undefined && direct !== null && String(direct).trim() !== "") {
    const num = Number(direct);
    if (!Number.isNaN(num)) return num;
  }

  const floor = rec.floor as Record<string, unknown> | undefined;
  const floorLot =
    floor?.lotId ??
    floor?.parkingLotId ??
    (floor?.lot as Record<string, unknown> | undefined)?.id;
  if (
    floorLot !== undefined &&
    floorLot !== null &&
    String(floorLot).trim() !== ""
  ) {
    const num = Number(floorLot);
    if (!Number.isNaN(num)) return num;
  }

  const spot = (rec.spot ?? rec.space) as Record<string, unknown> | undefined;
  if (spot) {
    const spotLot = getItemLotId(spot);
    if (spotLot !== undefined) return spotLot;
  }

  const ticket = rec.ticket as Record<string, unknown> | undefined;
  if (ticket) {
    const ticketLot = getItemLotId(ticket);
    if (ticketLot !== undefined) return ticketLot;
  }

  return undefined;
}

export default function DashboardPage() {
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<number | "ALL">(1);

  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [reservations, setReservations] = useState<unknown[]>([]);
  const [reservationsTotal, setReservationsTotal] = useState<number>(0);

  const [dateRange, setDateRange] = useState<DateRangeFilter>("ALL");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "ALL">(
    "ALL",
  );
  const [searchText, setSearchText] = useState("");

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        lotsRes,
        spacesRes,
        ticketsRes,
        paymentsRes,
        subsRes,
        reservationsRes,
      ] = await Promise.all([
        getParkingLots().catch(() => []),
        getParkingSpaces(),
        getTicketsPaginated({ page: 1, limit: 100 }),
        getPaymentsPaginated({ page: 1, limit: 100 }),
        SubscriptionsService.findAll(),
        getReservationsPaginated({ page: 1, limit: 100 }).catch(() => ({
          data: [],
          meta: { total: 0 },
        })),
      ]);

      setLots(Array.isArray(lotsRes) ? lotsRes : []);
      setSpaces(Array.isArray(spacesRes) ? spacesRes : []);
      setTickets(ticketsRes?.data ?? []);
      setPayments(paymentsRes?.data ?? []);
      setSubscriptions(Array.isArray(subsRes) ? subsRes : []);
      setReservations(
        Array.isArray(reservationsRes?.data) ? reservationsRes.data : [],
      );
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

  const lotSpaces = useMemo(() => {
    if (selectedLot === "ALL") return spaces;
    return spaces.filter((space) => getItemLotId(space) === Number(selectedLot));
  }, [spaces, selectedLot]);

  const lotSpaceNumbers = useMemo(() => {
    const nums = new Set<string>();
    for (const space of lotSpaces) {
      const rec = space as Record<string, unknown>;
      const raw = String(rec.spaceNumber ?? rec.number ?? rec.code ?? "")
        .trim()
        .toLowerCase();
      if (raw) nums.add(raw);
    }
    return nums;
  }, [lotSpaces]);

  const lotTickets = useMemo(() => {
    if (selectedLot === "ALL") return tickets;
    return tickets.filter((ticket) => {
      const lotId = getItemLotId(ticket);
      if (lotId !== undefined) return lotId === Number(selectedLot);

      const rec = ticket as Record<string, unknown>;
      const spotRec = rec.spot as Record<string, unknown> | undefined;
      const spaceNum = String(
        rec.spaceNumber ?? spotRec?.spaceNumber ?? rec.spotNumber ?? "",
      )
        .trim()
        .toLowerCase();
      return spaceNum ? lotSpaceNumbers.has(spaceNum) : false;
    });
  }, [tickets, selectedLot, lotSpaceNumbers]);

  const lotTicketIds = useMemo(() => {
    const ids = new Set<string | number>();
    for (const ticket of lotTickets) {
      if (ticket.id !== undefined && ticket.id !== null) {
        ids.add(ticket.id);
      }
    }
    return ids;
  }, [lotTickets]);

  const lotPayments = useMemo(() => {
    if (selectedLot === "ALL") return payments;
    return payments.filter((payment) => {
      const lotId = getItemLotId(payment);
      if (lotId !== undefined) return lotId === Number(selectedLot);

      const rec = payment as Record<string, unknown>;
      const ticketRec = rec.ticket as Record<string, unknown> | undefined;
      const ticketId = rec.ticketId ?? ticketRec?.id;
      if (
        ticketId !== undefined &&
        ticketId !== null &&
        lotTicketIds.has(ticketId as string | number)
      ) {
        return true;
      }

      const spotRec = ticketRec?.spot as Record<string, unknown> | undefined;
      const spaceNum = String(ticketRec?.spaceNumber ?? spotRec?.spaceNumber ?? "")
        .trim()
        .toLowerCase();
      return spaceNum ? lotSpaceNumbers.has(spaceNum) : false;
    });
  }, [payments, selectedLot, lotTicketIds, lotSpaceNumbers]);

  const lotSubscriptions = useMemo(() => {
    if (selectedLot === "ALL") return subscriptions;
    return subscriptions.filter((sub) => {
      const lotId = getItemLotId(sub);
      if (lotId !== undefined) return lotId === Number(selectedLot);
      return true;
    });
  }, [subscriptions, selectedLot]);

  const lotReservationsCount = useMemo(() => {
    if (selectedLot === "ALL") return reservationsTotal;
    if (reservations.length === 0) return 0;
    return reservations.filter((resItem) => {
      const lotId = getItemLotId(resItem);
      if (lotId !== undefined) return lotId === Number(selectedLot);
      const rec = resItem as Record<string, unknown>;
      const spotRec = rec.spot as Record<string, unknown> | undefined;
      const spaceNum = String(rec.spaceNumber ?? spotRec?.spaceNumber ?? "")
        .trim()
        .toLowerCase();
      return spaceNum ? lotSpaceNumbers.has(spaceNum) : false;
    }).length;
  }, [reservations, reservationsTotal, selectedLot, lotSpaceNumbers]);

  const filteredPayments = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return lotPayments.filter((payment) => {
      const paymentDate = resolvePaymentDate(payment as PaymentWithFallbackDates);
      if (!isWithinRange(paymentDate, dateRange)) return false;

      const normalizedMethod = String(payment.method || "")
        .trim()
        .toUpperCase();
      if (methodFilter !== "ALL" && normalizedMethod !== methodFilter) {
        return false;
      }

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
        const methodText = normalizedMethod.toLowerCase();
        if (
          !plate.includes(q) &&
          !space.includes(q) &&
          !origin.includes(q) &&
          !methodText.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [lotPayments, dateRange, methodFilter, searchText]);

  const filteredTickets = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return lotTickets.filter((ticket) => {
      const ticketDate = resolveTicketDate(ticket as TicketWithFallbackDates);
      if (!isWithinRange(ticketDate, dateRange)) return false;

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
  }, [lotTickets, dateRange, searchText]);

  const spaceCountsByStatus = useMemo(() => {
    const counts: Record<ParkingSpaceStatus, number> = {
      FREE: 0,
      OCCUPIED: 0,
      RESERVED: 0,
      OUT_OF_SERVICE: 0,
    };
    for (const space of lotSpaces) {
      const st = String(space.status || "")
        .trim()
        .toUpperCase() as ParkingSpaceStatus;
      if (st in counts) {
        counts[st] += 1;
      }
    }
    return counts;
  }, [lotSpaces]);

  const revenueByMethod = useMemo(() => {
    const totals: Record<PaymentMethod, number> = {
      CASH: 0,
      CREDIT_CARD: 0,
      DEBIT_CARD: 0,
      PAYPAL: 0,
    };
    for (const payment of filteredPayments) {
      const method = String(payment.method || "")
        .trim()
        .toUpperCase() as PaymentMethod;
      if (method in totals) {
        totals[method] += Number(payment.amount || 0);
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
    () =>
      lotTickets.filter(
        (t) => String(t.status || "").trim().toUpperCase() === "ACTIVE",
      ).length,
    [lotTickets],
  );

  const activeSubscriptionsCount = useMemo(
    () =>
      lotSubscriptions.filter(
        (s) =>
          !dayjs().isAfter(dayjs(s.endDate)) &&
          String(s.status || "").trim().toUpperCase() === "ACTIVE",
      ).length,
    [lotSubscriptions],
  );

  const lotOptions = useMemo(() => {
    const items = lots.map((lot) => ({
      label: lot.name,
      value: Number(lot.id),
    }));
    if (items.length === 0) {
      items.push({ label: "Lote 1", value: 1 });
    }
    return [{ label: "Todos los lotes", value: "ALL" as const }, ...items];
  }, [lots]);

  return (
    <Flex vertical gap={14}>
      {contextHolder}

      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={12}>
        <HeaderPage title="Dashboard" />
        <Space wrap size={8}>
          <Select
            size="small"
            style={{ minWidth: 200 }}
            value={selectedLot}
            onChange={(val) => setSelectedLot(val)}
            options={lotOptions}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void loadDashboardData()}
            loading={loading}
          >
            Actualizar Panel
          </Button>
        </Space>
      </Flex>

      <DashboardKpis
        loading={loading}
        totalSpaces={lotSpaces.length}
        occupiedSpaces={spaceCountsByStatus.OCCUPIED}
        freeSpaces={spaceCountsByStatus.FREE}
        activeTicketsCount={activeTicketsCount}
        periodRevenue={totalPeriodRevenue}
        periodPaymentsCount={filteredPayments.length}
        activeSubscriptionsCount={activeSubscriptionsCount}
        totalSubscriptionsCount={lotSubscriptions.length}
      />

      <ParkingMapCard
        refreshTrigger={refreshTrigger}
        selectedLot={selectedLot}
      />

      <DashboardFilters
        dateRange={dateRange}
        methodFilter={methodFilter}
        searchText={searchText}
        onDateRangeChange={setDateRange}
        onMethodFilterChange={setMethodFilter}
        onSearchTextChange={setSearchText}
        onClear={() => {
          setDateRange("ALL");
          setMethodFilter("ALL");
          setSearchText("");
        }}
      />

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <DashboardChartsAndOccupancy
            loading={loading}
            revenueByMethod={revenueByMethod}
            totalPeriodRevenue={totalPeriodRevenue}
            spaceCountsByStatus={spaceCountsByStatus}
            totalSpaces={lotSpaces.length}
          />
        </Col>

        <Col xs={24} lg={12}>
          <OperationalSummaryCard
            loading={loading}
            activeTicketsCount={activeTicketsCount}
            totalTicketsCount={filteredTickets.length}
            reservationsTotal={lotReservationsCount}
            activeSubscriptionsCount={activeSubscriptionsCount}
            totalSubscriptionsCount={lotSubscriptions.length}
            periodRevenue={totalPeriodRevenue}
            periodPaymentsCount={filteredPayments.length}
          />
        </Col>
      </Row>

      <RecentActivityCard
        loading={loading}
        tickets={filteredTickets}
        payments={filteredPayments}
      />
    </Flex>
  );
}