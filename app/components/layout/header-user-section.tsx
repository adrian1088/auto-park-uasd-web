'use client';

import {
  BellOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Divider,
  Dropdown,
  Flex,
  MenuProps,
  Space,
} from 'antd';
import Link from 'antd/lib/typography/Link';
import Avatar from '../Avatar';

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
  const items: MenuProps['items'] = [
    {
      label: <Link href="/profile">Mi Perfil</Link>,
      key: 'profile',
      icon: <UserOutlined />,
    },
    {
      label: 'Cerrar sesión',
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      disabled: isLoggingOut,
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'logout' && !isLoggingOut) {
      void onLogout();
    }
  };

  return (
    <Space size="middle">
      <Button type="dashed" shape="circle" icon={<SettingOutlined />} />
      <Badge count="4">
        <Button type="dashed" shape="circle" icon={<BellOutlined />} />
      </Badge>
      <Divider vertical />
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{
          items: items,
          onClick: handleMenuClick,
        }}
      >
        <Flex
          align="center"
          style={{ cursor: 'pointer', opacity: isLoggingOut ? 0.7 : 1 }}
        >
          <Avatar fullName={user?.name} />
        </Flex>
      </Dropdown>
    </Space>
  );
}
