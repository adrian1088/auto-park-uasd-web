/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Condition, FieldName, FormValues, When } from "./types";

export const getValue = (values: FormValues, name: FieldName) => {
  const path = Array.isArray(name) ? name : [name];
  return path.reduce<any>((acc, key) => acc?.[key], values);
};

const isEmpty = (v: unknown) =>
  v === undefined ||
  v === null ||
  v === "" ||
  (Array.isArray(v) && v.length === 0);

const evaluateCondition = (c: Condition, values: FormValues): boolean => {
  if ("and" in c) return c.and.every((x) => evaluateCondition(x, values));
  if ("or" in c) return c.or.some((x) => evaluateCondition(x, values));
  if ("not" in c) return !evaluateCondition(c.not, values);

  const v = getValue(values, c.field);
  switch (c.op) {
    case "eq":
      return v === c.value;
    case "neq":
      return v !== c.value;
    case "in":
      return Array.isArray(c.value) && c.value.includes(v);
    case "notIn":
      return Array.isArray(c.value) && !c.value.includes(v);
    case "gt":
      return v > c.value;
    case "gte":
      return v >= c.value;
    case "lt":
      return v < c.value;
    case "lte":
      return v <= c.value;
    case "truthy":
      return !!v;
    case "empty":
      return isEmpty(v);
  }
};

export const evaluate = (
  when: When | boolean | undefined,
  values: FormValues,
  fallback: boolean,
): boolean => {
  if (when === undefined) return fallback;
  if (typeof when === "boolean") return when;
  if (typeof when === "function") return when(values);
  return evaluateCondition(when, values);
};

