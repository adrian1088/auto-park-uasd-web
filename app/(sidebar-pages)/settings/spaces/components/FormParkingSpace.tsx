"use client";

import type { FormInstance } from "antd";
import { DynamicForm, type FieldConfig } from "@/app/components/form";
import type { ParkingFloor } from "@/app/lib/api/floors";

const typeOptions = [
  { label: "Automóvil", value: "CAR" },
  { label: "Camión", value: "TRUCK" },
  { label: "Motocicleta", value: "MOTORCYCLE" },
  { label: "Camioneta", value: "VAN" },
  { label: "Autobús", value: "BUS" },
  { label: "SUV", value: "SUV" },
  { label: "Pickup", value: "PICKUP" },
];

const statusOptions = [
  { label: "Libre", value: "FREE" },
  { label: "Ocupado", value: "OCCUPIED", disabled: true },
  { label: "Reservado", value: "RESERVED", disabled: true },
  { label: "Fuera de servicio", value: "OUT_OF_SERVICE" },
];

type Props = {
  form: FormInstance;
  floors: Array<Pick<ParkingFloor, "id" | "floorNumber" | "lot">>;
  initialValues?: Record<string, unknown>;
  isEditing: boolean;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
};

const FormParkingSpace = ({
  form,
  floors,
  initialValues,
  isEditing,
  onSubmit,
}: Props) => {
  const fields: FieldConfig[] = [
    {
      name: "floorId",
      label: "Piso",
      type: "select",
      required: true,
      options: floors.map((floor) => ({
        label: `${floor.lot.name} — Piso ${floor.floorNumber}`,
        value: Number(floor.id),
      })),
      span: 24,
    },
    {
      name: "spaceNumber",
      label: "Número del espacio",
      type: "text",
      required: true,
      rules: [
        {
          max: 10,
          message: "El número no puede superar 10 caracteres.",
        },
      ],
      props: { maxLength: 10 },
    },
    {
      name: "type",
      label: "Tipo de vehículo",
      type: "select",
      required: true,
      options: typeOptions,
    },
  ];

  if (isEditing) {
    fields.push({
      name: "status",
      label: "Estado",
      type: "select",
      options: statusOptions,
      disabled: (values) =>
        values.status === "OCCUPIED" || values.status === "RESERVED",
      helpText:
        "Los estados Ocupado y Reservado se actualizan desde los flujos operativos.",
    });
  }

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

export default FormParkingSpace;
