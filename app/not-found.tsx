import { Button, Result } from 'antd';

const NotFound = () => {
  return (
    <Result
      status="404"
      title="404"
      subTitle="Lo sentimos, la página que visitaste no existe."
      extra={<Button href='/' type="primary">Volver al inicio</Button>}
    />
  );
};

export default NotFound;
