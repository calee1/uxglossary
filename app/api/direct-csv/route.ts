import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Direct file access to check the CSV file
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        {
          error: "CSV file not found",
          path: csvPath,
          cwd: process.cwd(),
          dirContents: fs.readdirSync(process.cwd()),
        },
        { status: 404 },
      )
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.trim().split("\n")

    // Count items per letter
    const letterCounts: Record<string, number> = {}

    // Skip header (line 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const values = line.split(",")
        if (values.length >= 1) {
          const letter = values[0].toUpperCase()
          letterCounts[letter] = (letterCounts[letter] || 0) + 1
        }
      } catch (error) {
        continue
      }
    }

    return NextResponse.json({
      csvPath,
      fileExists: true,
      fileSize: csvContent.length,
      totalLines: lines.length,
      headerLine: lines[0],
      sampleLines: lines.slice(1, 4),
      letterCounts,
      letters: Object.keys(letterCounts).sort(),
    })
  } catch (error) {
    console.error("Direct CSV API error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
