import Image from "next/image";

export type AppLogoFullProps = {
  variant?: "full" | "side" | "sideCollapsed";
};

export const AppLogo = ({ variant = "full" }: AppLogoFullProps) => {
  if (variant === "sideCollapsed") {
    return (
      <Image
        loading="eager"
        src="/images/logo-without-name.png"
        alt="Auto Park UASD"
        width={40}
        height={60}
        style={{
          width: "100%",
          maxWidth: 60,
          height: "auto",
        }}
      />
    );
  }
  if (variant === "side") {
    return (
      <Image
        loading="eager"
        src="/images/logo2.png"
        alt="Auto Park UASD"
        width={230}
        height={60}
        style={{
          width: "100%",
          maxWidth: 230,
          height: "auto",
        }}
      />
    );
  }

  return (
    <Image
      loading="eager"
      src="/images/logo.png"
      alt="Auto Park UASD"
      width={855}
      height={247}
      style={{
        width: "100%",
        maxWidth: 300,
        height: "auto",
        marginBottom: 44,
      }}
    />
  );
};
