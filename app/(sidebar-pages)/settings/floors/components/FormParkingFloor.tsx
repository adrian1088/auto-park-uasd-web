"use client";

import type { FormInstance } from "antd";
import { DynamicForm, type FieldConfig } from "@/app/components/form";
import type { ParkingLot } from "@/app/lib/api/lots";

type Props = {
  form: FormInstance;
  lots: ParkingLot[];
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
};

const FormParkingFloor = ({ form, lots, initialValues, onSubmit }: Props) => {
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
      name: "floorNumber",
      label: "Número de piso",
      type: "number",
      required: true,
      rules: [
        {
          type: "integer",
          message: "El número de piso debe ser un número entero.",
        },
      ],
      props: { precision: 0 },
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

export default FormParkingFloor;
