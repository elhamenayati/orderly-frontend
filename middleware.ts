import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MARKETING_ORIGIN =
  process.env.NEXT_PUBLIC_MARKETING_SITE_URL ?? "http://localhost:3000";
const CUSTOMER_ORIGIN =
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "http://localhost:4000";

const CUSTOMER_PATH_PREFIXES = ["/book", "/s"];

function requestPort(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const fromHost = host.split(":")[1];
  if (fromHost) return fromHost;
  return request.nextUrl.port || "80";
}

function isCustomerSurface(request: NextRequest) {
  if (process.env.APP_SURFACE === "customer") return true;
  if (process.env.APP_SURFACE === "marketing") return false;
  return requestPort(request) === "4000";
}

function isCustomerPath(pathname: string) {
  // `/` is marketing on 3000 and the customer hub on 4000 (rewritten to /s).
  return CUSTOMER_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isPassthrough(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icon") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPassthrough(pathname)) {
    return NextResponse.next();
  }

  const customerSurface = isCustomerSurface(request);

  if (customerSurface) {
    if (pathname === "/s" || pathname.startsWith("/s/")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/s" ? "/" : pathname.replace(/^\/s/, "") || "/";
      return NextResponse.redirect(url);
    }

    if (pathname === "/") {
      return NextResponse.rewrite(new URL(`/s${search}`, request.url));
    }

    if (isCustomerPath(pathname)) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL(`${pathname}${search}`, MARKETING_ORIGIN));
  }

  if (isCustomerPath(pathname)) {
    const targetPath = pathname === "/s" || pathname.startsWith("/s/") ? "/" : pathname;
    return NextResponse.redirect(new URL(`${targetPath}${search}`, CUSTOMER_ORIGIN));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
