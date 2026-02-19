import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") || ""
  const isLandingDomain =
    hostname === "thesovcie.com" || hostname === "www.thesovcie.com"

  if (isLandingDomain) {
    const { pathname } = req.nextUrl
    if (pathname === "/" || pathname === "") {
      return NextResponse.rewrite(new URL("/landing.html", req.url))
    }
    return NextResponse.next()
  }

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          res.cookies.set({ name, value: "", ...options })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isLoginPage = req.nextUrl.pathname.startsWith("/login")

  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (session && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return res
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
}