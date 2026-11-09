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
  console.log("🚀 ~ getErrorMessage ~ error:", error);
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
};