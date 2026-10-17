'use client';
import {
  Alert,
  Button,
  Checkbox,
  Flex,
  Form,
  Input,
  Typography,
  message,
} from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/app/lib/api/auth';
import { http, HttpError } from '@/app/lib/http';

const { Title, Paragraph } = Typography;

const SignInPage = () => {
  const router = useRouter();
  const isAuthenticated = http.storage.exposesToken && !!http.storage.get();
  const isLoading = false;
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const onFinish = async (values: {
    identifier: string;
    password: string;
    remember: boolean;
  }) => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await login(values.identifier, values.password);
      message.success('Bienvenido de nuevo');
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
    } catch (error) {
      setErrorMessage(
        error instanceof HttpError && error.status === 401
          ? 'Credenciales inválidas. Verifica tu usuario/correo y contraseña.'
          : 'No se pudo iniciar sesión',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        width: "100%",
        maxWidth: 380,
        margin: "0 auto",
        padding: "0 24px",
      }}
      vertical
    >

      <Title level={1}>Auto Park UASD</Title>
      <Title level={2}>Iniciar sesión</Title>
      <Paragraph style={{ textAlign: "center" }} type="secondary">
        Usa tu nombre de usuario o dirección de correo electrónico para ingresar
        a la plataforma.
      </Paragraph>
      {errorMessage ? (
        <Alert
          title={errorMessage}
          type="error"
          showIcon
          style={{ width: "100%", marginBottom: 16 }}
        />
      ) : null}
      <Form
        name="login"
        disabled={submitting || isLoading}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        style={{ width: "100%" }}
        layout="vertical"
      >
        <Form.Item
          name="identifier"
          rules={[
            {
              required: true,
              message:
                "Por favor ingresa tu nombre de usuario o correo electrónico!",
            },
          ]}
        >
          <Input
            size="large"
            prefix={<UserOutlined />}
            placeholder="Nombre de usuario o correo electrónico"
            autoComplete="username"
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[
            { required: true, message: "Por favor ingresa tu contraseña!" },
          ]}
        >
          <Input
            size="large"
            prefix={<LockOutlined />}
            type="password"
            placeholder="Contraseña"
            autoComplete="current-password"
          />
        </Form.Item>
        <Form.Item>
          <Flex justify="space-between" align="center">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Recuérdame</Checkbox>
            </Form.Item>
            <Link href="/forgot-password">Olvidaste tu contraseña</Link>
          </Flex>
        </Form.Item>

        <Form.Item>
          <Button
            block
            type="primary"
            size="large"
            htmlType="submit"
            loading={submitting || isLoading}
          >
            Iniciar sesión
          </Button>
        </Form.Item>
      </Form>
    </Flex>
  );
};

export default SignInPage;

