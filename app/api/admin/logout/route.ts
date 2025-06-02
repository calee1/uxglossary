import { NextResponse } from "next/server"

export async function POST() {
  console.log("Logout request received")

  const response = NextResponse.json({ success: true })

  // Clear the auth cookie
  response.cookies.set("admin_auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
    path: "/",
  })

  return response
}
