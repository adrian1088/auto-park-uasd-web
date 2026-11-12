"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { http } from "../lib/http";
import AppShellLayout from "../components/layout/AppShellLayout";
import { getCurrentUser, logout } from "../lib/api/auth";
import type { CurrentUser } from "../components/layout/HeaderUserSection";
import { SIDEBAR_NAV_ITEMS } from "../components/layout/SideNav";

const LayoutShell = ({ children }: { children: React.ReactNode }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Modo localStorage
  useEffect(() => {
    if (http.storage.exposesToken && !http.storage.get()) {
      router.replace("/sign-in");
    }
  }, [pathname, router]);

  // ATAJO DE TECLADO: Ctrl + Shift + E para abrir la pantalla de entrada (/entrance) en nueva pestaña
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "e") {
        event.preventDefault();
        window.open("/customer-panel", "_blank");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Carga el usuario autenticado (/me) al entrar a las rutas privadas, p. ej. tras el sign-in.
  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((response) => {
        console.log("~ LayoutShell ~ response:", response);
        if (active) {
          setCurrentUser(response);
        }
      })
      .catch(() => active && setCurrentUser(null));
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // la sesión local se limpia 
    } finally {
      router.replace("/sign-in");
      setIsLoggingOut(false);
    }
  };

  return (
    <AppShellLayout
      pathname={pathname}
      visibleItems={SIDEBAR_NAV_ITEMS}
      currentUser={currentUser ?? undefined}
      handleSignOut={handleLogout}
      isSigningOut={isLoggingOut}
    >
      {children}
    </AppShellLayout>
  );
};

export default LayoutShell;