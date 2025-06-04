import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: "Glossary file not found" }, { status: 404 })
    }

    const stats = fs.statSync(csvPath)
    const lastModified = stats.mtime

    // Format date as "4 June 2025"
    const formattedDate = lastModified.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    return NextResponse.json({ lastUpdated: formattedDate })
  } catch (error) {
    console.error("Error getting last updated date:", error)
    return NextResponse.json({ error: "Failed to get last updated date" }, { status: 500 })
  }
}
