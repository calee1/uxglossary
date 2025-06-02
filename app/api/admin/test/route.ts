import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    console.log("Test endpoint called")

    // Test basic functionality
    const testData = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd(),
    }

    // Test file system access
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")
    const dataDir = path.resolve(process.cwd(), "data")

    const fileSystemInfo = {
      csvPath,
      csvExists: fs.existsSync(csvPath),
      dataDir,
      dataDirExists: fs.existsSync(dataDir),
      dataDirContents: fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : "Directory not found",
    }

    // Test CSV reading
    let csvInfo = {}
    try {
      if (fs.existsSync(csvPath)) {
        const csvContent = fs.readFileSync(csvPath, "utf-8")
        const lines = csvContent.trim().split("\n")
        csvInfo = {
          fileSize: csvContent.length,
          lineCount: lines.length,
          firstLine: lines[0] || "Empty file",
          sampleLines: lines.slice(0, 3),
        }
      }
    } catch (csvError) {
      csvInfo = { error: csvError instanceof Error ? csvError.message : "Unknown CSV error" }
    }

    return NextResponse.json({
      success: true,
      testData,
      fileSystemInfo,
      csvInfo,
    })
  } catch (error) {
    console.error("Test endpoint error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
