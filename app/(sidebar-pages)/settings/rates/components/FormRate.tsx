"use client";

import type { FormInstance } from "antd";
import { DynamicForm, type FieldConfig } from "@/app/components/form";
import { ParkingLot } from "@/app/lib/api/lots";

export const rateTypeOptions = [
  { label: "Por hora", value: "HOURLY" },
  { label: "Diaria", value: "DAILY" },
  { label: "Mensual", value: "MONTHLY" },
];

type Props = {
  form: FormInstance;
  lots: ParkingLot[];
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
};

const FormRate = ({ form, lots, initialValues, onSubmit }: Props) => {
  const fields: FieldConfig[] = [
    {
      name: "parkingLotId",
      label: "Estacionamiento",
      type: "select",
      required: true,
      options: lots.map((lot) => ({ label: lot.name, value: lot.id })),
      span: 24,
    },
    {
      name: "type",
      label: "Tipo",
      type: "select",
      required: true,
      options: rateTypeOptions,
    },
    {
      name: "amount",
      label: "Monto",
      type: "number",
      required: true,
      props: { min: 0.01, max: 999999.99, precision: 2 },
    },
    {
      name: "validFrom",
      label: "Válida desde",
      type: "date",
      required: true,
      props: { showTime: true },
    },
    {
      name: "validTo",
      label: "Válida hasta",
      type: "date",
      props: { showTime: true },
    },
  ];

  return (
    <DynamicForm
      form={form}
      fields={fields}
      columns={2}
      initialValues={initialValues}
      onSubmit={onSubmit}
      hideActions
    />
  );
};

export default FormRate;
