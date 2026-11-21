"use client";

import { Button, Flex, Layout, Menu, MenuProps, Typography } from "antd";
import Image from "next/image";
import { useState } from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { getSidebarNavState, SidebarNavItemConfig } from "./SideNav";
import { CurrentUser, HeaderUserSection } from "./HeaderUserSection";
import Link from "next/link";
import { AppLogo } from "../AppLogo";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

export type AppShellLayoutProps = React.PropsWithChildren<{
  pathname: string;
  visibleItems: SidebarNavItemConfig[];
  currentUser?: CurrentUser;
  handleSignOut?: () => void;
  isSigningOut?: boolean;
}>;

type SidebarNavProps = {
  pathname: string;
  can: (permission: string) => boolean;
  items: SidebarNavItemConfig[];
};

type SidebarMenuItem = NonNullable<MenuProps["items"]>[number];

function buildMenuItems(
  items: SidebarNavItemConfig[],
  can: SidebarNavProps["can"],
): SidebarMenuItem[] {
  return items.map((item) => {
    if (item.children?.length) {
      return {
        key: item.key,
        icon: item.icon,
        label: item.label,
        children: buildMenuItems(item.children, can),
      };
    }

    return {
      key: item.key,
      icon: item.icon,
      label: item.href ? (
        <Link href={item.href}>{item.label}</Link>
      ) : (
        item.label
      ),
      disabled: item.requiredPermission ? !can(item.requiredPermission) : false,
    };
  });
}

const AppShellLayout = ({
  children,
  pathname,
  visibleItems,
  handleSignOut,
  isSigningOut = false,
  currentUser,
}: AppShellLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { selectedKey, openKeys: matchedOpenKeys } = getSidebarNavState(
    pathname,
    visibleItems,
  );
  const [openKeys, setOpenKeys] = useState<string[]>(matchedOpenKeys);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={260}
        theme="dark"
        trigger={null}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        breakpoint="lg"
      >
        <Flex
          align="center"
          justify="center"
          style={{
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "4px",
            paddingBottom: "8px",
          }}
          vertical
        >
          {collapsed ? (
            <AppLogo variant="sideCollapsed" />
          ) : (
            <AppLogo variant="side" />
          )}
        </Flex>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={(nextOpenKeys) => setOpenKeys(nextOpenKeys as string[])}
          items={buildMenuItems(visibleItems, () => true)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Button
            type="default"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              //   width: 64,
              //   height: 64
            }}
          />
          <HeaderUserSection
            user={currentUser ?? null}
            isLoggingOut={isSigningOut}
            onLogout={() => handleSignOut?.()}
          />
        </Header>
        <Content style={{ margin: "24px 16px 0", overflow: "initial" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppShellLayout;
