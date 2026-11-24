"use client";

import { Button, Flex, Layout, Menu, MenuProps } from "antd";
import Image from "next/image";
import { useState } from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { getSidebarNavState, SidebarNavItemConfig } from "./SideNav";
import { CurrentUser, HeaderUserSection } from "./HeaderUserSection";
import Link from "next/link";
import { AppLogo } from "../AppLogo";

const { Header, Sider, Content } = Layout;

const SIDER_WIDTH = 260;
const SIDER_COLLAPSED_WIDTH = 80;
const HEADER_HEIGHT = 64;

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

  const currentSidebarWidth = collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={SIDER_WIDTH}
        collapsedWidth={SIDER_COLLAPSED_WIDTH}
        theme="dark"
        trigger={null}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        breakpoint="lg"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          height: "100vh",
          overflowY: "auto",
          zIndex: 100,
        }}
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

      <Layout
        style={{
          marginLeft: currentSidebarWidth,
          transition: "margin-left 0.2s",
          minWidth: 0,
        }}
      >
        <Header
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            left: currentSidebarWidth,
            height: HEADER_HEIGHT,
            zIndex: 90,
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #f0f0f0",
            transition: "left 0.2s",
          }}
        >
          <Button
            type="default"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
            }}
          />
          <HeaderUserSection
            user={currentUser ?? null}
            isLoggingOut={isSigningOut}
            onLogout={() => handleSignOut?.()}
          />
        </Header>

        <Content
          style={{
            paddingTop: HEADER_HEIGHT + 24,
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 24,
            overflow: "initial",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppShellLayout;