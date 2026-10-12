"use client";

import { Button, Divider, Flex, Form, Row, Typography } from "antd";
import { useState } from "react";
import { evaluate } from "./conditions";
import FieldRenderer from "./FieldRenderer";
import {
  FormFieldsError,
  type DynamicFormProps,
  type FormSection,
  type FormValues,
} from "./types";

const DynamicForm = ({
  fields,
  sections,
  columns = 2,
  gutter = 16,
  layout = "vertical",
  size,
  initialValues,
  form: externalForm,
  onSubmit,
  onValuesChange,
  loading,
  disabled,
  submitText = "Guardar",
  resetText = "Limpiar",
  showReset,
  hideActions,
  footer,
}: DynamicFormProps) => {
  const [internalForm] = Form.useForm();
  const form = externalForm ?? internalForm;
  const [submitting, setSubmitting] = useState(false);

  const allSections: FormSection[] = sections ?? [{ fields: fields ?? [] }];
  const busy = submitting || !!loading;

  const handleFinish = async (values: FormValues) => {
    if (!onSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof FormFieldsError) {
        form.setFields(
          Object.entries(error.fieldErrors).map(([name, message]) => ({
            name,
            errors: [message],
          })),
        );
      } else {
        throw error;
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout={layout}
      size={size}
      initialValues={initialValues}
      onFinish={handleFinish}
      onValuesChange={onValuesChange}
      disabled={disabled || busy}
      scrollToFirstError
      preserve={false}
      requiredMark="optional"
    >
      {allSections.map((section, index) => (
        <Form.Item noStyle shouldUpdate key={index}>
          {() =>
            evaluate(section.visibleWhen, form.getFieldsValue(true), true) ? (
              <>
                {section.title && (
                  <Divider titlePlacement="start">{section.title}</Divider>
                )}
                {section.description && (
                  <Typography.Paragraph type="secondary">
                    {section.description}
                  </Typography.Paragraph>
                )}
                <Row gutter={gutter}>
                  {section.fields.map((field) => (
                    <FieldRenderer
                      key={
                        Array.isArray(field.name)
                          ? field.name.join(".")
                          : field.name
                      }
                      field={field}
                      columns={section.columns ?? columns}
                      formDisabled={disabled}
                    />
                  ))}
                </Row>
              </>
            ) : null
          }
        </Form.Item>
      ))}

      {footer ??
        (!hideActions && (
          <Flex justify="end" gap={8}>
            {showReset && (
              <Button onClick={() => form.resetFields()} disabled={busy}>
                {resetText}
              </Button>
            )}
            <Button type="primary" htmlType="submit" loading={busy}>
              {submitText}
            </Button>
          </Flex>
        ))}
    </Form>
  );
};

export default DynamicForm;

