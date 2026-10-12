import type { FormInstance, FormRule } from "antd";
import type { ReactNode } from "react";

export type FormValues = Record<string, unknown>;
export type FieldName = string | (string | number)[];

export type FieldType =
  | "text"
  | "password"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "switch"
  | "date"
  | "dateRange"
  | "time"
  | "upload"
  | "slider"
  | "autocomplete"
  | "custom";

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";

export type Option = { label: ReactNode; value: unknown; disabled?: boolean };

export type ConditionOp =
  | "eq"
  | "neq"
  | "in"
  | "notIn"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "truthy"
  | "empty";

export type Condition =
  | { field: FieldName; op: ConditionOp; value?: unknown }
  | { and: Condition[] }
  | { or: Condition[] }
  | { not: Condition };

/** Declarative condition or a function receiving all current form values. */
export type When = Condition | ((values: FormValues) => boolean);

export type OptionsSource =
  | Option[]
  | ((values: FormValues) => Option[] | Promise<Option[]>);

export interface FieldConfig {
  name: FieldName;
  label?: ReactNode;
  type: FieldType;
  /** Overrides the column width (1-24) or sets it per breakpoint. */
  span?: number | Partial<Record<Breakpoint, number>>;
  /** Static options, or a (async) function. Re-run when `dependsOn` values change. */
  options?: OptionsSource;
  rules?: FormRule[];
  /** Shortcut: true uses a default message, a string uses it as message. */
  required?: boolean | string;
  placeholder?: string;
  tooltip?: ReactNode;
  helpText?: ReactNode;
  initialValue?: unknown;
  disabled?: boolean | When;
  /** Field is rendered only when this evaluates to true. */
  visibleWhen?: When;
  /** Field is required only when this evaluates to true. */
  requiredWhen?: When;
  /** Remove the value when the field is hidden. Default: true. */
  clearOnHide?: boolean;
  /** Other fields that trigger revalidation and options reload. */
  dependsOn?: FieldName[];
  /** Props passed down to the underlying antd component. */
  props?: Record<string, unknown>;
  /** Custom control used when type is "custom". Receives value/onChange. */
  render?: (form: FormInstance, values: FormValues) => ReactNode;
}

export interface FormSection {
  title?: ReactNode;
  description?: ReactNode;
  fields: FieldConfig[];
  /** Overrides the form-level columns for this section. */
  columns?: Columns;
  visibleWhen?: When;
}

export type Columns = number | Partial<Record<Breakpoint, number>>;

export interface DynamicFormProps {
  fields?: FieldConfig[];
  sections?: FormSection[];
  /** Fields per row (1-24 divisors, e.g. 1, 2, 3, 4, 6) or per breakpoint. Default 2. */
  columns?: Columns;
  gutter?: number;
  layout?: "vertical" | "horizontal" | "inline";
  size?: "small" | "middle" | "large";
  initialValues?: FormValues;
  /** External instance, e.g. to call form.submit() from a Modal. */
  form?: FormInstance;
  /**
   * Submit handler. Throw a FormFieldsError to show server errors per field;
   * any other error is rethrown to the caller.
   */
  onSubmit?: (values: FormValues) => void | Promise<void>;
  onValuesChange?: (changed: FormValues, all: FormValues) => void;
  loading?: boolean;
  disabled?: boolean;
  submitText?: string;
  resetText?: string;
  showReset?: boolean;
  /** Hide the built-in buttons (e.g. when rendered inside a Modal). */
  hideActions?: boolean;
  footer?: ReactNode;
}

export class FormFieldsError extends Error {
  constructor(public fieldErrors: Record<string, string>) {
    super("Form field errors");
  }
}


