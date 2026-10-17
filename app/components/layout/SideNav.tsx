import {
  AppstoreOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  SettingOutlined,
} from "@ant-design/icons";

export type SidebarNavItemConfig = {
  key: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  matchPrefixes?: string[];
  requiredPermission?: string;
  children?: SidebarNavItemConfig[];
};

type SidebarNavMatch = {
  key: string;
  score: number;
  openKeys: string[];
};

function getMatchScore(pathname: string, matchPrefixes: string[] = []): number {
  return matchPrefixes.reduce((bestScore, prefix) => {
    if (prefix === "/") {
      return pathname === "/" ? Math.max(bestScore, 1) : bestScore;
    }

    if (!pathname.startsWith(prefix)) {
      return bestScore;
    }

    return Math.max(bestScore, prefix.length);
  }, -1);
}

function findBestSidebarNavMatch(
  pathname: string,
  items: SidebarNavItemConfig[],
  parentKeys: string[] = [],
): SidebarNavMatch | undefined {
  let bestMatch: SidebarNavMatch | undefined;

  for (const item of items) {
    const ownMatchScore = getMatchScore(pathname, item.matchPrefixes);

    if (
      ownMatchScore >= 0 &&
      (!bestMatch ||
        ownMatchScore > bestMatch.score ||
        (ownMatchScore === bestMatch.score &&
          parentKeys.length > bestMatch.openKeys.length))
    ) {
      bestMatch = {
        key: item.key,
        score: ownMatchScore,
        openKeys: parentKeys,
      };
    }

    if (!item.children?.length) {
      continue;
    }

    const childMatch = findBestSidebarNavMatch(pathname, item.children, [
      ...parentKeys,
      item.key,
    ]);

    if (
      childMatch &&
      (!bestMatch ||
        childMatch.score > bestMatch.score ||
        (childMatch.score === bestMatch.score &&
          childMatch.openKeys.length > bestMatch.openKeys.length))
    ) {
      bestMatch = childMatch;
    }
  }

  return bestMatch;
}

export function getSidebarNavState(
  pathname: string,
  items: SidebarNavItemConfig[],
) {
  const matchedItem = findBestSidebarNavMatch(pathname, items);

  return {
    selectedKey: matchedItem?.key ?? "dashboard",
    openKeys: matchedItem?.openKeys ?? [],
  };
}

export const SIDEBAR_NAV_ITEMS: SidebarNavItemConfig[] = [
  {
    key: "dashboard",
    href: "/",
    label: "Dashboard",
    icon: <AppstoreOutlined />,
    matchPrefixes: ["/"],
  },
  {
    key: "rates",
    label: "Tarifas",
    href: "/rates",
    icon: <DollarOutlined />,
    matchPrefixes: ["/rates"],
  },
  {
    key: "users",
    label: "Usuarios",
    href: "/users",
    icon: <UserOutlined />,
    matchPrefixes: ["/users"],
  },
  {
    key: "reservations",
    label: "Reservaciones",
    href: "/reservations",
    icon: <CalendarOutlined />,
    matchPrefixes: ["/reservations"],
  },
  {
    key: "payments",
    label: "Pagos",
    href: "/payments",
    icon: <CreditCardOutlined />,
    matchPrefixes: ["/payments"],
  },
  {
    key: "settings",
    icon: <SettingOutlined />,
    label: "Configuraciones",
    matchPrefixes: ["/settings"],
    children: [
      {
        key: "profile",
        href: "/settings/lots",
        label: "Localidades de estacionamiento",
        matchPrefixes: ["/settings/lots"],
      },
      {
        key: "floors",
        href: "/settings/floors",
        label: "Pisos de estacionamiento",
        matchPrefixes: ["/settings/floors"],
      },
      {
        key: "spaces",
        href: "/settings/spaces",
        label: "Espacios de estacionamiento",
        matchPrefixes: ["/settings/spaces"],
      },
    ],
  },
];
