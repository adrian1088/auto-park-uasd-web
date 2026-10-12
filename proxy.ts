import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/sign-in", "/check-in", "/check-out"];
const isPublic = (p: string) =>
  PUBLIC_PATHS.some((x) => p === x || p.startsWith(`${x}/`));

// Cookies httpOnly que indican sesión (access o refresh; si solo queda el refresh,
// el cliente HTTP renueva el access token en la primera request).
const sessionCookies = (process.env.AUTH_COOKIE_NAMES ?? "Authentication,Refresh")
  .split(",")
  .map((n) => n.trim())
  .filter(Boolean);

export function proxy(request: NextRequest) {
  // En modo localStorage el servidor no ve el token; la guarda va en el cliente.
  if (process.env.NEXT_PUBLIC_TOKEN_STORAGE !== "cookie") return NextResponse.next();

  const { pathname } = request.nextUrl;
  const hasSession = sessionCookies.some((n) => request.cookies.has(n));

  if (!hasSession && !isPublic(pathname)) {
    const url = new URL("/sign-in", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (hasSession && pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
