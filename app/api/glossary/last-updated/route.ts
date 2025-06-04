import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Build date is set at build time
const BUILD_DATE = new Date().toISOString()

export async function GET() {
  try {
    let mostRecentDate = new Date(BUILD_DATE)

    // Check if CSV file exists and get its modification date
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

    if (fs.existsSync(csvPath)) {
      const stats = fs.statSync(csvPath)
      const csvModifiedDate = stats.mtime

      // Use whichever date is more recent
      if (csvModifiedDate > mostRecentDate) {
        mostRecentDate = csvModifiedDate
      }
    }

    // Format date as "4 June 2025"
    const formattedDate = mostRecentDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    return NextResponse.json({
      lastUpdated: formattedDate,
      debug: {
        buildDate: BUILD_DATE,
        csvExists: fs.existsSync(csvPath),
        csvModified: fs.existsSync(csvPath) ? fs.statSync(csvPath).mtime.toISOString() : null,
        mostRecent: mostRecentDate.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error getting last updated date:", error)
    return NextResponse.json({ error: "Failed to get last updated date" }, { status: 500 })
  }
}
