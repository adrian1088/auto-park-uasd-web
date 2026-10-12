export type SidebarNavIcon =
  | "home"
  | "users"
  | "calendar"
  | "payments"
  | "settings"
  | "rates"

export type SidebarNavItemConfig = {
  key: string;
  label: string;
  href?: string;
  icon?: SidebarNavIcon;
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
    icon: "home",
    matchPrefixes: ["/"],
  },
  {
    key: "rates",
    label: "Tarifas",
    href: "/rates",
    icon: "rates",
    matchPrefixes: ["/rates"],
  },
  {
    key: "users",
    label: "Usuarios",
    href: "/users",
    icon: "users",
    matchPrefixes: ["/users"],
  },
  {
    key: "reservations",
    label: "Reservaciones",
    href: "/reservations",
    icon: "calendar",
    matchPrefixes: ["/reservations"],
  },
  {
    key: "payments",
    label: "Pagos",
    href: "/payments",
    icon: "payments",
    matchPrefixes: ["/payments"],
  },
  {
    key: "settings",
    href: "/settings",
    label: "Configuraciones",
    icon: "settings",
    matchPrefixes: ["/settings"],
  },
];