"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, Col, Flex, message, Row } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import HeaderPage from "@/app/components/HeaderPage";
import {
  checkOutTicket,
  getCheckoutQuote,
  getTicketsPaginated,
  type CheckoutQuote,
  type Ticket,
} from "@/app/lib/api/tickets";
import type { PaymentMethod } from "@/app/lib/api/payments";
import { ActiveTicketsList } from "./components/ActiveTicketsList";
import { CheckoutDetailPanel } from "./components/CheckoutDetailPanel";

function getErrorMessage(error: unknown): string {
  if (!error) return "Ocurrió un error inesperado.";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  const errObj = error as {
    message?: unknown;
    body?: { message?: unknown };
    data?: { message?: unknown };
  };
  const raw =
    errObj.body?.message ?? errObj.data?.message ?? errObj.message ?? error;
  return Array.isArray(raw) ? raw.join(", ") : String(raw);
}

export default function CheckOutPage() {
  const [messageApi, contextHolder] = message.useMessage();

  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [searchText, setSearchText] = useState("");

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    "CASH" as PaymentMethod,
  );
  const [submitting, setSubmitting] = useState(false);
  const [completedTicket, setCompletedTicket] = useState<Ticket | null>(null);

  const refreshActiveTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const response = await getTicketsPaginated({
        status: "ACTIVE",
        page: 1,
        limit: 50,
      });
      setActiveTickets(response.data ?? []);
    } catch (error) {
      messageApi.error(
        `No se pudieron cargar los tickets activos: ${getErrorMessage(error)}`,
      );
    } finally {
      setLoadingTickets(false);
    }
  }, [messageApi]);

  useEffect(() => {
    let active = true;

    getTicketsPaginated({
      status: "ACTIVE",
      page: 1,
      limit: 50,
    })
      .then((response) => {
        if (active) {
          setActiveTickets(response.data ?? []);
        }
      })
      .catch((error) => {
        if (active) {
          messageApi.error(
            `No se pudieron cargar los tickets activos: ${getErrorMessage(error)}`,
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoadingTickets(false);
        }
      });

    return () => {
      active = false;
    };
  }, [messageApi]);

  const handleSelectTicket = useCallback(
    async (ticket: Ticket) => {
      setCompletedTicket(null);
      setSelectedTicket(ticket);
      setQuote(null);
      setQuoteError(null);
      setLoadingQuote(true);

      try {
        const quoteData = await getCheckoutQuote(ticket.id);
        setQuote(quoteData);
      } catch (error) {
        const msg = getErrorMessage(error);
        setQuoteError(msg);
        messageApi.warning(msg);
      } finally {
        setLoadingQuote(false);
      }
    },
    [messageApi],
  );

  const handleConfirmCheckOut = async () => {
    if (!selectedTicket || submitting) return;

    setSubmitting(true);
    try {
      const updatedTicket = await checkOutTicket(
        selectedTicket.id,
        paymentMethod,
      );
      setCompletedTicket(updatedTicket);
      setSelectedTicket(null);
      setQuote(null);
      messageApi.success("Check-Out completado correctamente.");
      await refreshActiveTickets();
    } catch (error) {
      messageApi.error(`Error en Check-Out: ${getErrorMessage(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const ticketPlate = (ticket: Ticket) =>
    ticket.vehiclePlateNumber ||
    ticket.plateNumber ||
    ticket.vehicle?.plateNumber ||
    ticket.reservation?.vehiclePlateNumber ||
    "N/A";

  const ticketSpace = (ticket: Ticket) =>
    ticket.spaceNumber ||
    ticket.spot?.spaceNumber ||
    ticket.spotNumber ||
    ticket.reservation?.parkingSpace?.spaceNumber ||
    "N/A";

  const filteredTickets = activeTickets.filter((ticket) => {
    const query = searchText.trim().toLowerCase();
    if (!query) return true;
    const plate = ticketPlate(ticket).toLowerCase();
    const space = ticketSpace(ticket).toLowerCase();
    return plate.includes(query) || space.includes(query);
  });

  return (
    <Flex vertical gap={16}>
      {contextHolder}

      <Flex justify="space-between" align="flex-start">
        <HeaderPage
          title="Check-Out"
          description="Calcular estadía por horas, registrar pago y liberar espacio."
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => void refreshActiveTickets()}
          loading={loadingTickets}
        >
          Refrescar Vista
        </Button>
      </Flex>

      <Row gutter={16} align="top">
        <Col xs={24} lg={10}>
          <ActiveTicketsList
            tickets={filteredTickets}
            loading={loadingTickets}
            searchText={searchText}
            selectedTicketId={selectedTicket?.id ?? null}
            onSearchChange={setSearchText}
            onSelectTicket={(ticket) => void handleSelectTicket(ticket)}
            getPlate={ticketPlate}
            getSpace={ticketSpace}
          />
        </Col>

        <Col xs={24} lg={14}>
          <CheckoutDetailPanel
            selectedTicket={selectedTicket}
            completedTicket={completedTicket}
            quote={quote}
            loadingQuote={loadingQuote}
            quoteError={quoteError}
            paymentMethod={paymentMethod}
            submitting={submitting}
            onPaymentMethodChange={setPaymentMethod}
            onConfirmCheckOut={() => void handleConfirmCheckOut()}
            onCancel={() => {
              setSelectedTicket(null);
              setQuote(null);
              setQuoteError(null);
            }}
            onResetCompleted={() => setCompletedTicket(null)}
            getPlate={ticketPlate}
            getSpace={ticketSpace}
          />
        </Col>
      </Row>
    </Flex>
  );
}