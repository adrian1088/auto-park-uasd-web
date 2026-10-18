"use client";

import { Button, DatePicker, Flex, Input, Select } from "antd";
import type { TicketFilters, TicketStatus } from "@/app/lib/api/tickets";
import { ticketStatusLabels } from "./DataTableTicket";

const statusOptions = (Object.keys(ticketStatusLabels) as TicketStatus[]).map(
  (status) => ({ value: status, label: ticketStatusLabels[status].label }),
);

type Props = {
  value: TicketFilters;
  onChange: (filters: TicketFilters) => void;
};

const FilterTicket = ({ value, onChange }: Props) => (
  <Flex gap={8} wrap>
    <Input.Search
      allowClear
      placeholder="Buscar por código"
      style={{ width: 240 }}
      onSearch={(code) => onChange({ ...value, code: code.trim() || undefined })}
    />
    <Select
      allowClear
      placeholder="Estado"
      style={{ width: 160 }}
      options={statusOptions}
      value={value.status}
      onChange={(status?: TicketStatus) => onChange({ ...value, status })}
    />
    <DatePicker.RangePicker
      onChange={(range) =>
        onChange({
          ...value,
          fromDate: range?.[0]?.startOf("day").toISOString(),
          toDate: range?.[1]?.endOf("day").toISOString(),
        })
      }
    />
    <Button onClick={() => onChange({})}>Limpiar</Button>
  </Flex>
);

export default FilterTicket;
