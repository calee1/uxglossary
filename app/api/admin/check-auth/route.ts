import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const adminAuth = request.cookies.get("admin_auth")?.value

  console.log("Auth check - cookie value:", adminAuth)

  if (adminAuth === "true") {
    return NextResponse.json({ authenticated: true })
  }

  return NextResponse.json({ authenticated: false }, { status: 401 })
}
