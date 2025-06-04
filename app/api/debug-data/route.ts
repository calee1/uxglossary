import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Check if CSV file exists
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")
    const fileExists = fs.existsSync(csvPath)

    if (!fileExists) {
      return NextResponse.json({
        error: "CSV file not found",
        csvPath,
        cwd: process.cwd(),
      })
    }

    // Read and parse CSV
    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.trim().split("\n")

    // Try to load using our parser
    const { loadGlossaryData } = await import("@/lib/csv-parser.server")
    const glossaryData = await loadGlossaryData()

    return NextResponse.json({
      success: true,
      csvPath,
      fileExists,
      totalLines: lines.length,
      firstLine: lines[0],
      sampleLines: lines.slice(0, 3),
      parsedData: {
        totalLetters: Object.keys(glossaryData).length,
        letters: Object.keys(glossaryData),
        totalTerms: Object.values(glossaryData).reduce((sum, items) => sum + items.length, 0),
        sampleTerms: Object.values(glossaryData)[0]?.slice(0, 3) || [],
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
