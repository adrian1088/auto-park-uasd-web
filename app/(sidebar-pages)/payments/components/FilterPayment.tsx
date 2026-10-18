"use client";

import { Button, Flex, InputNumber, Select } from "antd";
import type { PaymentFilters, PaymentMethod } from "@/app/lib/api/payments";
import { paymentMethodOptions } from "./FormPayment";

type Props = {
  value: PaymentFilters;
  onChange: (filters: PaymentFilters) => void;
};

const FilterPayment = ({ value, onChange }: Props) => (
  <Flex gap={8} wrap>
    <InputNumber
      min={1}
      precision={0}
      placeholder="ID del ticket"
      value={value.ticketId}
      onChange={(ticketId) =>
        onChange({ ...value, ticketId: ticketId ?? undefined })
      }
    />
    <Select
      allowClear
      placeholder="Método de pago"
      style={{ width: 200 }}
      options={paymentMethodOptions}
      value={value.method}
      onChange={(method?: PaymentMethod) => onChange({ ...value, method })}
    />
    <Button onClick={() => onChange({})}>Limpiar</Button>
  </Flex>
);

export default FilterPayment;
