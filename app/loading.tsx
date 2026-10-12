import { Spin } from "antd";

export default function Loading() {
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <Spin description="Procesando..." size="large" />
    </div>
  );
}
