import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    console.log("=== SIMPLE TEST START ===")

    // Step 1: Check if file exists
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")
    const fileExists = fs.existsSync(csvPath)
    console.log("File exists:", fileExists)

    if (!fileExists) {
      return NextResponse.json({ error: "File not found", path: csvPath })
    }

    // Step 2: Read file
    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.trim().split("\n")
    console.log("Total lines:", lines.length)
    console.log("First line:", lines[0])
    console.log("Second line:", lines[1])

    // Step 3: Simple parsing test
    let aCount = 0
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith("A,") || line.startsWith('"A"')) {
        aCount++
      }
    }
    console.log("Lines starting with A:", aCount)

    // Step 4: Test our parser function
    let parserResult = null
    try {
      const { loadGlossaryData } = await import("@/lib/csv-parser.server")
      console.log("About to call loadGlossaryData...")
      const data = await loadGlossaryData()
      console.log("loadGlossaryData returned:", Object.keys(data))
      parserResult = {
        success: true,
        keys: Object.keys(data),
        aCount: data["A"]?.length || 0,
        bCount: data["B"]?.length || 0,
        totalItems: Object.values(data).reduce((sum, items) => sum + items.length, 0),
      }
    } catch (error) {
      console.error("Parser error:", error)
      parserResult = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    return NextResponse.json({
      fileExists,
      totalLines: lines.length,
      firstLine: lines[0],
      secondLine: lines[1],
      simpleACount: aCount,
      parserResult,
    })
  } catch (error) {
    console.error("Simple test error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
