import { type NextRequest, NextResponse } from "next/server"

// This should be a secure, hashed password in a real application
// For this example, we're using a simple password
const ADMIN_PASSWORD = "l3tm3intogloss@12"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    console.log("Login attempt received")
    console.log("Password provided:", password ? "***" : "empty")
    console.log("Expected password:", ADMIN_PASSWORD ? "***" : "empty")

    if (password === ADMIN_PASSWORD) {
      console.log("Password correct, setting auth cookie")

      // Create response with success
      const response = NextResponse.json({ success: true })

      // Set HTTP-only cookie for authentication
      response.cookies.set("admin_auth", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      })

      console.log("Cookie set successfully")
      return response
    } else {
      console.log("Password incorrect")
      console.log("Provided:", password)
      console.log("Expected:", ADMIN_PASSWORD)
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
