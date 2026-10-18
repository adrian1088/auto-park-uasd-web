export const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString("es-DO") : "-";

export const formatMoney = (value: number) =>
  Number(value).toLocaleString("es-DO", {
    style: "currency",
    currency: "DOP",
  });
