/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { UploadOutlined } from "@ant-design/icons";
import {
  AutoComplete,
  Button,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Slider,
  Switch,
  TimePicker,
  Upload,
} from "antd";
import type { FormInstance, FormRule } from "antd";
import { useEffect, useState } from "react";
import { evaluate, getValue } from "./conditions";
import type { Columns, FieldConfig, FormValues, Option } from "./types";

const BREAKPOINTS = ["xs", "sm", "md", "lg", "xl"] as const;

const toSpan = (columns: Columns) => {
  if (typeof columns === "number") {
    return { span: Math.max(1, Math.floor(24 / columns)) };
  }
  const result: Record<string, number> = {};
  for (const bp of BREAKPOINTS) {
    const n = columns[bp];
    if (n) result[bp] = Math.max(1, Math.floor(24 / n));
  }
  return result;
};

const colProps = (field: FieldConfig, columns: Columns) =>
  field.span === undefined
    ? toSpan(columns)
    : typeof field.span === "number"
      ? { span: field.span }
      : field.span;

type ControlProps = {
  field: FieldConfig;
  form: FormInstance;
  values: FormValues;
  disabled: boolean;
  [key: string]: any;
};

const useOptions = (field: FieldConfig, values: FormValues) => {
  const source = field.options;
  const depsKey = JSON.stringify(
    (field.dependsOn ?? []).map((d) => getValue(values, d)),
  );
  const [async, setAsync] = useState<{ key: string; options: Option[] }>({
    key: "",
    options: [],
  });

  useEffect(() => {
    if (!source || Array.isArray(source)) return;
    let cancelled = false;
    Promise.resolve(source(values))
      .catch(() => [] as Option[])
      .then(
        (result) => !cancelled && setAsync({ key: depsKey, options: result }),
      );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, depsKey]);

  const isAsync = !!source && !Array.isArray(source);
  const options = Array.isArray(source) ? source : async.options;
  const loading = isAsync && async.key !== depsKey;
  return { options, loading };
};

// Form.Item injects value/onChange into this component; they are forwarded to the antd control.
const FieldControl = ({
  field,
  form,
  values,
  disabled,
  ...injected
}: ControlProps) => {
  const { options, loading } = useOptions(field, values);
  const common = {
    ...injected,
    disabled,
    placeholder: field.placeholder,
    ...field.props,
  };

  switch (field.type) {
    case "text":
      return <Input allowClear {...common} />;
    case "password":
      return <Input.Password {...common} />;
    case "textarea":
      return <Input.TextArea rows={3} {...common} />;
    case "number":
      return <InputNumber style={{ width: "100%" }} {...common} />;
    case "select":
      return (
        <Select
          allowClear
          showSearch={{ optionFilterProp: "label" }}
          loading={loading}
          options={options}
          {...common}
        />
      );
    case "multiselect":
      return (
        <Select
          mode="multiple"
          allowClear
          showSearch={{ optionFilterProp: "label" }}
          loading={loading}
          options={options}
          {...common}
        />
      );
    case "autocomplete":
      return <AutoComplete options={options} {...common} />;
    case "radio":
      return <Radio.Group options={options} {...common} />;
    case "checkbox":
      return options.length ? (
        <Checkbox.Group options={options} {...common} />
      ) : (
        <Checkbox {...common} checked={injected["checked"]} />
      );
    case "switch":
      return <Switch {...common} checked={injected["checked"]} />;
    case "date":
      return <DatePicker style={{ width: "100%" }} {...common} />;
    case "dateRange":
      return (
        <DatePicker.RangePicker
          style={{ width: "100%" }}
          {...common}
          placeholder={undefined}
          {...field.props}
        />
      );
    case "time":
      return <TimePicker style={{ width: "100%" }} {...common} />;
    case "slider":
      return <Slider {...common} />;
    case "upload":
      return (
        <Upload
          beforeUpload={() => false}
          fileList={injected.value}
          onChange={(e) => injected.onChange?.(e.fileList)}
          {...field.props}
        >
          <Button icon={<UploadOutlined />} disabled={disabled}>
            Seleccionar archivo
          </Button>
        </Upload>
      );
    case "custom":
      return <>{field.render?.(form, values)}</>;
  }
};

type Props = {
  field: FieldConfig;
  columns: Columns;
  formDisabled?: boolean;
};

const FieldRenderer = ({ field, columns, formDisabled }: Props) => {
  const dependencies = [...(field.dependsOn ?? [])] as any[];
  const valuePropName =
    field.type === "checkbox" && !Array.isArray(field.options)
      ? "checked"
      : field.type === "switch"
        ? "checked"
        : undefined;

  return (
    <Form.Item noStyle shouldUpdate>
      {(form) => {
        const values: FormValues = form.getFieldsValue(true);
        if (!evaluate(field.visibleWhen, values, true)) return null;

        const required = field.requiredWhen
          ? evaluate(field.requiredWhen, values, false)
          : !!field.required;
        const rules: FormRule[] = [...(field.rules ?? [])];
        if (required) {
          rules.unshift({
            required: true,
            message:
              typeof field.required === "string"
                ? field.required
                : `${typeof field.label === "string" ? field.label : "Este campo"} es obligatorio`,
          });
        }
        const disabled =
          !!formDisabled || evaluate(field.disabled, values, false);

        return (
          <Col {...colProps(field, columns)}>
            <Form.Item
              name={field.name}
              label={field.label}
              tooltip={field.tooltip}
              extra={field.helpText}
              rules={rules}
              initialValue={field.initialValue}
              dependencies={dependencies.length ? dependencies : undefined}
              preserve={field.clearOnHide === false}
              valuePropName={
                field.type === "upload" ? "fileList" : valuePropName
              }
              getValueFromEvent={
                field.type === "upload"
                  ? (e: any) => (Array.isArray(e) ? e : e?.fileList)
                  : undefined
              }
            >
              <FieldControl
                field={field}
                form={form}
                values={values}
                disabled={disabled}
                valuePropName={valuePropName}
              />
            </Form.Item>
          </Col>
        );
      }}
    </Form.Item>
  );
};

export default FieldRenderer;
