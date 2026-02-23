import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const COUNTRY_COOKIE = "pst_country";

const PROTECTED_PATHS = [
  "/create",
  "/brand-kit",
  "/history",
  "/settings",
  "/admin",
  "/checkout",
  "/onboarding",
  "/notifications",
  "/top-up",
  "/templates/editor",
  "/templates/pick",
];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function resolveCountry(req: NextRequest): string {
  const headerCountry = req.headers.get("x-vercel-ip-country");
  if (headerCountry && /^[A-Z]{2}$/i.test(headerCountry)) {
    return headerCountry.toUpperCase();
  }
  return "US";
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — this is required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtectedRoute(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // Set country detection cookie (from Vercel geo headers)
  const country = resolveCountry(request);
  const existing = request.cookies.get(COUNTRY_COOKIE)?.value;
  if (existing !== country) {
    supabaseResponse.cookies.set(COUNTRY_COOKIE, country, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return supabaseResponse;
}
