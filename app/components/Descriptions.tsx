import { Flex, Typography } from "antd";

const { Text } = Typography;

export interface DescriptionsItemsProps {
  key: React.Key;
  label: React.ReactNode;
  content: React.ReactNode;
}

export interface DescriptionsProps {
  items: DescriptionsItemsProps[];
  columns?: number;
  gap?: string;
  styleItem?: React.CSSProperties;
  style?: React.CSSProperties;
}

const Descriptions = (props: DescriptionsProps) => {
  const columns = props.columns ?? 1;

  if (!Number.isInteger(columns) || columns < 1) {
    throw new RangeError("Descriptions columns must be a positive integer");
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        ...props.style,
      }}
    >
      {props.items.map((item) => (
        <Flex
          key={item.key}
          style={{ gap: props.gap ?? "2px", marginBottom: "12px", marginRight: "16px", ...props.styleItem }}
          vertical
        >
          <div style={{ flex: 1, fontSize: "16px" }}>
            <Text strong>{item.label}</Text>
          </div>
          <div style={{ flex: 1 }}>{item.content}</div>
        </Flex>
      ))}
    </div>
  );
};

export default Descriptions;
