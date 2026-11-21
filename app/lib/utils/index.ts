import { HttpError } from "../http";

export const requiredText = (
  values: Record<string, unknown>,
  key: string,
  label: string,
) => {
  const value = values[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} es obligatorio.`);
  }
  return value.trim();
};

export const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpError) {
    const body = error.body as { message?: string | string[] };
    return Array.isArray(body.message)
      ? body.message.join(", ")
      : (body.message ?? `Error HTTP ${error.status}`);
  }
  return "Ocurrió un error inesperado.";
};