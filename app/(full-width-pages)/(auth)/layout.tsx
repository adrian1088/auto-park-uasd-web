"use client";
import React from "react";
import { Flex } from "antd";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Flex style={{ height: "100vh" }} align="center" justify="center">
      {children}
    </Flex>
  );
}
