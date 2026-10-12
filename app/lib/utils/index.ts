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
