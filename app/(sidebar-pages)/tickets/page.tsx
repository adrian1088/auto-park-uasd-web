"use client";

import { Card, Flex, message, Modal, Spin, Tag } from "antd";
import { useState } from "react";
import Descriptions from "@/app/components/Descriptions";
import HeaderPage from "@/app/components/HeaderPage";
import { getTicket } from "@/app/lib/api/tickets";
import type { Ticket, TicketFilters } from "@/app/lib/api/tickets";
import { formatDateTime, formatMoney } from "@/app/lib/utils/format";
import DataTableTicket, { ticketStatusLabels } from "./components/DataTableTicket";
import FilterTicket from "./components/FilterTicket";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

const TicketsPage = () => {
  const [filters, setFilters] = useState<TicketFilters>({});
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const openDetail = async (id: number) => {
    setSelectedTicket(null);
    setDetailOpen(true);
    setLoadingDetail(true);
    try {
      setSelectedTicket(await getTicket(id));
    } catch (error) {
      setDetailOpen(false);
      messageApi.error(
        `No se pudo cargar el ticket: ${getErrorMessage(error)}`,
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <HeaderPage
        title="Tickets"
        description="Manejar los tickets del sistema."
      />

      <Card
        title="Todos los tickets"
        styles={{ body: { padding: 0 } }}
        extra={<FilterTicket value={filters} onChange={setFilters} />}
      >
        <DataTableTicket filters={filters} onView={openDetail} />
      </Card>

      <Modal
        open={detailOpen}
        title="Detalle del ticket"
        footer={null}
        onCancel={() => setDetailOpen(false)}
        destroyOnHidden
      >
        <Spin spinning={loadingDetail}>
          {selectedTicket && (
            <Descriptions
              columns={2}
              items={[
                { key: "code", label: "Código", content: selectedTicket.code },
                {
                  key: "status",
                  label: "Estado",
                  content: (
                    <Tag color={ticketStatusLabels[selectedTicket.status].color}>
                      {ticketStatusLabels[selectedTicket.status].label}
                    </Tag>
                  ),
                },
                {
                  key: "entranceAt",
                  label: "Entrada",
                  content: formatDateTime(selectedTicket.entranceAt),
                },
                {
                  key: "exitAt",
                  label: "Salida",
                  content: formatDateTime(selectedTicket.exitAt),
                },
                {
                  key: "rateAmount",
                  label: "Tarifa",
                  content: formatMoney(selectedTicket.rateAmount),
                },
              ]}
            />
          )}
        </Spin>
      </Modal>
    </Flex>
  );
};

export default TicketsPage;
