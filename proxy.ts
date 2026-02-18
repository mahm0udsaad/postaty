import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COUNTRY_COOKIE = "pst_country";
const AUTH_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const isProtectedRoute = createRouteMatcher([
  "/create(.*)",
  "/brand-kit(.*)",
  "/history(.*)",
  "/settings(.*)",
  "/admin(.*)",
  "/checkout(.*)",
  "/onboarding(.*)",
  "/templates/editor(.*)",
  "/templates/pick(.*)",
]);

function resolveCountry(req: NextRequest): string {
  const headerCountry = req.headers.get("x-vercel-ip-country");
  if (headerCountry && /^[A-Z]{2}$/i.test(headerCountry)) {
    return headerCountry.toUpperCase();
  }
  return "US";
}

export default clerkMiddleware(async (auth, req) => {
  if (AUTH_ENABLED && isProtectedRoute(req)) {
    await auth.protect();
  }

  const response = NextResponse.next();
  const country = resolveCountry(req);
  const existing = req.cookies.get(COUNTRY_COOKIE)?.value;

  if (existing !== country) {
    response.cookies.set(COUNTRY_COOKIE, country, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
