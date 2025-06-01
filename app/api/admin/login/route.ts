import { type NextRequest, NextResponse } from "next/server"

// This should be a secure, hashed password in a real application
// For this example, we're using a simple password
const ADMIN_PASSWORD = "UXglossary2025"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (password === ADMIN_PASSWORD) {
      // Create a response with a success message
      const response = NextResponse.json({ success: true })

      // Set a secure HTTP-only cookie for authentication
      // This is more secure than localStorage
      response.cookies.set({
        name: "admin_auth",
        value: "true",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      })

      return response
    }

    return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
