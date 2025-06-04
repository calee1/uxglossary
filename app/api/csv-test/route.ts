import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    console.log("=== CSV TEST START ===")

    // Test 1: Check current working directory
    const cwd = process.cwd()
    console.log("Current working directory:", cwd)

    // Test 2: Check if data directory exists
    const dataDir = path.join(cwd, "data")
    const dataDirExists = fs.existsSync(dataDir)
    console.log("Data directory exists:", dataDirExists)
    console.log("Data directory path:", dataDir)

    // Test 3: List contents of data directory
    let dataDirContents = []
    if (dataDirExists) {
      dataDirContents = fs.readdirSync(dataDir)
      console.log("Data directory contents:", dataDirContents)
    }

    // Test 4: Check if CSV file exists
    const csvPath = path.join(dataDir, "glossary.csv")
    const csvExists = fs.existsSync(csvPath)
    console.log("CSV file exists:", csvExists)
    console.log("CSV file path:", csvPath)

    // Test 5: If CSV exists, read first few lines
    let csvInfo = null
    if (csvExists) {
      const csvContent = fs.readFileSync(csvPath, "utf-8")
      const lines = csvContent.split("\n")
      csvInfo = {
        totalLines: lines.length,
        firstLine: lines[0],
        secondLine: lines[1],
        thirdLine: lines[2],
        fileSize: csvContent.length,
        startsWithHeader: lines[0]?.includes("letter,term,definition"),
      }
      console.log("CSV info:", csvInfo)
    }

    // Test 6: Try to use our parser
    let parserResult = null
    try {
      const { loadGlossaryData } = await import("@/lib/csv-parser.server")
      const data = await loadGlossaryData()
      parserResult = {
        success: true,
        letterCount: Object.keys(data).length,
        totalTerms: Object.values(data).reduce((sum, items) => sum + items.length, 0),
        sampleLetters: Object.keys(data).slice(0, 5),
        firstTermFromA: data.A?.[0] || "No A terms",
      }
      console.log("Parser result:", parserResult)
    } catch (error) {
      parserResult = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
      console.log("Parser error:", parserResult)
    }

    return NextResponse.json({
      cwd,
      dataDir: {
        path: dataDir,
        exists: dataDirExists,
        contents: dataDirContents,
      },
      csvFile: {
        path: csvPath,
        exists: csvExists,
        info: csvInfo,
      },
      parser: parserResult,
    })
  } catch (error) {
    console.error("CSV test error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
