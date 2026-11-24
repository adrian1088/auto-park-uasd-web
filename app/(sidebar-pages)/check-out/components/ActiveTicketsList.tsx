"use client";

import React from "react";
import { Card, Flex, Input, List, Space, Tag, Typography } from "antd";
import { CarOutlined, SearchOutlined } from "@ant-design/icons";
import type { Ticket } from "@/app/lib/api/tickets";
import { formatDateTime } from "@/app/lib/utils/format";

const { Text } = Typography;

interface ActiveTicketsListProps {
  tickets: Ticket[];
  loading: boolean;
  searchText: string;
  selectedTicketId: number | null;
  onSearchChange: (value: string) => void;
  onSelectTicket: (ticket: Ticket) => void;
  getPlate: (ticket: Ticket) => string;
  getSpace: (ticket: Ticket) => string;
}

export function ActiveTicketsList({
  tickets,
  loading,
  searchText,
  selectedTicketId,
  onSearchChange,
  onSelectTicket,
  getPlate,
  getSpace,
}: ActiveTicketsListProps) {
  return (
    <Card
      style={{
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
      title={
        <Space>
          <CarOutlined />
          <span>Tickets Activos ({tickets.length})</span>
        </Space>
      }
    >
      <Input
        allowClear
        placeholder="Buscar por matrícula o espacio..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      <List
        loading={loading}
        dataSource={tickets}
        locale={{ emptyText: "No hay tickets activos en este momento." }}
        renderItem={(ticket) => {
          const isSelected = selectedTicketId === ticket.id;
          return (
            <List.Item
              onClick={() => onSelectTicket(ticket)}
              style={{
                cursor: "pointer",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: 8,
                border: isSelected ? "1px solid #0284c7" : "1px solid #e2e8f0",
                background: isSelected ? "#f0f9ff" : "#ffffff",
              }}
            >
              <Flex vertical gap={4} style={{ width: "100%" }}>
                <Flex justify="space-between" align="center">
                  <Text strong style={{ color: "#0f172a" }}>
                    {getPlate(ticket)}
                  </Text>
                  <Tag                             //opcional 
                    style={{
                      color: "#0284c7",
                      background: "#e0f2fe",
                      border: "none",
                      fontWeight: 600,
                      padding: "2px 10px",
                      borderRadius: "6px",
                    }}
                  >
                    Activo
                  </Tag>                          
                </Flex>
                <Flex justify="space-between" style={{ fontSize: 12 }}>
                  <Text type="secondary">
                    Espacio: <Text strong>{getSpace(ticket)}</Text>
                  </Text>
                  <Text type="secondary">
                    Entrada: {formatDateTime(ticket.entranceAt)}
                  </Text>
                </Flex>
              </Flex>
            </List.Item>
          );
        }}
      />
    </Card>
  );
}