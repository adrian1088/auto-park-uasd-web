"use client";

import { BellOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import {
  Badge,
  Button,
  Divider,
  Dropdown,
  Flex,
  MenuProps,
  Space,
  Typography,
} from "antd";
import Link from "antd/lib/typography/Link";
import Avatar from "../Avatar";
import { useEffect, useState } from "react";

const { Text } = Typography;
export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
};

type HeaderUserSectionProps = {
  user: CurrentUser | null;
  isLoggingOut: boolean;
  onLogout: () => void;
};

export function HeaderUserSection({
  user,
  isLoggingOut,
  onLogout,
}: HeaderUserSectionProps) {
const [currentDateTime, setCurrentDateTime] = useState("");

useEffect(() => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const updateDateTime = () => {
    setCurrentDateTime(formatCurrentDateTime());
    const millisecondsUntilNextMinute = 60_000 - (Date.now() % 60_000);
    timeoutId = setTimeout(updateDateTime, millisecondsUntilNextMinute + 50);
  };

  updateDateTime();
  return () => clearTimeout(timeoutId);
}, []);

  const items: MenuProps["items"] = [
    {
      label: <Link href="/profile">Mi Perfil</Link>,
      key: "profile",
      icon: <UserOutlined />,
    },
    {
      label: "Cerrar sesión",
      key: "logout",
      icon: <LogoutOutlined />,
      danger: true,
      disabled: isLoggingOut,
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "logout" && !isLoggingOut) {
      void onLogout();
    }
  };

const formatCurrentDateTime = () => {
  const now = new Date();

  const date = now.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${date} ${time}`;
};
  return (
    <Space size="middle">
      <Text
        styles={{
          root: {
            color: "#1677ff",
          },
        }}
      >
        {currentDateTime}
      </Text>
      <Badge count="0">
        <Button type="dashed" shape="circle" icon={<BellOutlined />} />
      </Badge>
      <Divider vertical />
      <Dropdown
        trigger={["click"]}
        placement="bottomRight"
        menu={{
          items: items,
          onClick: handleMenuClick,
        }}
      >
        <Flex
          align="center"
          style={{ cursor: "pointer", opacity: isLoggingOut ? 0.7 : 1 }}
        >
          <Avatar fullName={user?.name} maxInitials={2} />
        </Flex>
      </Dropdown>
    </Space>
  );
}
