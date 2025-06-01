import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  try {
    // Check authentication (middleware should handle this, but double-check)
    const adminAuth = request.cookies.get("admin_auth")?.value
    if (adminAuth !== "true") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the path to the glossary CSV file
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: "Glossary file not found" }, { status: 404 })
    }

    // Read the CSV file
    const csvContent = fs.readFileSync(csvPath, "utf-8")

    // Return the CSV content with appropriate headers
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="ux-glossary-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error downloading glossary:", error)
    return NextResponse.json({ error: "Failed to download glossary" }, { status: 500 })
  }
}
