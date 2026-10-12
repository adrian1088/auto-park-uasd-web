import { Typography } from "antd";
const { Title, Text } = Typography;

export type HeaderPageProps = {
  title: string;
  description?: string;
};

const HeaderPage = ({ title, description }: HeaderPageProps) => {
  return (
    <div>
      <Title level={3} style={{ margin: 0 }}>
        {title}
      </Title>
      {description && (
        <Text type="secondary" style={{ marginBottom: 0 }}>
          {description}
        </Text>
      )}
    </div>
  );
};

export default HeaderPage;