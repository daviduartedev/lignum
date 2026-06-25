import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { AUTH_RETURN_PATH_COOKIE, cookieValueForReturnPath, returnPathFromNextUrl } from "@/lib/authReturnPath";
import {
  assertApiPostRateLimit,
  assertBodySizeLimit,
  assertGetAllQueryRateLimit,
  assertRegisterPostRateLimit,
} from "@/lib/rateLimitService";
import { fail } from "@/lib/jsonResponse";
import { corsHeaders } from "@/lib/cors";
import { withSecurityHeaders } from "@/lib/securityHeaders";
import { NextResponse } from "next/server";

const { auth: edgeAuth } = NextAuth(authConfig);

const PUBLIC_PAGE_PATHS = new Set(["/login", "/politica-privacidade"]);

function withCors(req: Request, res: Response): Response {
  withSecurityHeaders(res);
  const headers = corsHeaders(req);
  if (!headers) return res;
  headers.forEach((value, key) => res.headers.set(key, value));
  return res;
}

function forbiddenCorsOrigin(): Response {
  return withSecurityHeaders(fail("FORBIDDEN", 403, { message: "Origem nao autorizada." }));
}

function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGE_PATHS.has(pathname);
}

export default edgeAuth(async (req) => {
  const { pathname } = req.nextUrl;
  const method = req.method;

  if (pathname.startsWith("/api/auth")) {
    const cors = corsHeaders(req);
    if (!cors) return forbiddenCorsOrigin();
    if (method === "OPTIONS") {
      return withSecurityHeaders(new NextResponse(null, { status: 204, headers: cors }));
    }
    if (pathname === "/api/auth/register" && method === "POST") {
      const tooLarge = assertBodySizeLimit(req);
      if (tooLarge) return withCors(req, tooLarge);
      const limited = await assertRegisterPostRateLimit(req);
      if (limited) return withCors(req, limited);
    }
    return withCors(req, NextResponse.next());
  }

  if (pathname.startsWith("/api")) {
    const cors = corsHeaders(req);
    if (!cors) return forbiddenCorsOrigin();
    if (method === "OPTIONS") {
      return withSecurityHeaders(new NextResponse(null, { status: 204, headers: cors }));
    }
    const loggedIn = !!req.auth;
    if (!loggedIn) {
      return withCors(req, fail("UNAUTHENTICATED", 401));
    }
    const mutating = method === "POST" || method === "PUT" || method === "PATCH";
    if (mutating) {
      const tooLarge = assertBodySizeLimit(req);
      if (tooLarge) return withCors(req, tooLarge);
    }
    if (method === "POST") {
      const limited = await assertApiPostRateLimit(req);
      if (limited) return withCors(req, limited);
    }
    if (method === "GET" && req.nextUrl.searchParams.get("all") === "1") {
      const limited = await assertGetAllQueryRateLimit(req, req.auth?.user?.id);
      if (limited) return withCors(req, limited);
    }
    return withCors(req, NextResponse.next());
  }

  if (isPublicPage(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  const loggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  if (!loggedIn) {
    const login = new URL("/login", req.url);
    const res = withSecurityHeaders(NextResponse.redirect(login));
    const returnTo = returnPathFromNextUrl(pathname, req.nextUrl.search);
    if (returnTo && returnTo !== "/login") {
      res.cookies.set(AUTH_RETURN_PATH_COOKIE, cookieValueForReturnPath(returnTo), {
        path: "/",
        maxAge: 600,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
    return res;
  }

  if (pathname.startsWith("/configuracoes") && role !== "admin") {
    return withSecurityHeaders(NextResponse.redirect(new URL("/", req.url)));
  }

  return withSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
