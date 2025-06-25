import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const adminAuth = request.cookies.get("admin_auth")?.value

    console.log("Auth check - cookie exists:", !!adminAuth)
    console.log("Auth check - cookie value:", adminAuth)

    if (adminAuth === "true") {
      console.log("Authentication successful")
      return NextResponse.json({ authenticated: true })
    }

    console.log("Authentication failed - no valid cookie")
    return NextResponse.json({ authenticated: false }, { status: 401 })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
