import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if the request is for the admin area (but not the login page)
  if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/login")) {
    // Check if the user is authenticated
    const adminAuth = request.cookies.get("admin_auth")?.value

    console.log("Middleware: Checking admin auth for", request.nextUrl.pathname)
    console.log("Middleware: Cookie value:", adminAuth)

    // If not authenticated, redirect to login
    if (!adminAuth || adminAuth !== "true") {
      console.log("Middleware: Redirecting to login")
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    console.log("Middleware: Authentication successful")
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/download-glossary"],
}
