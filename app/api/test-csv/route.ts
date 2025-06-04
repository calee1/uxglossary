import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

    const result = {
      csvPath,
      fileExists: fs.existsSync(csvPath),
      cwd: process.cwd(),
      dataDir: path.resolve(process.cwd(), "data"),
      dataDirExists: fs.existsSync(path.resolve(process.cwd(), "data")),
    }

    if (result.fileExists) {
      const stats = fs.statSync(csvPath)
      const content = fs.readFileSync(csvPath, "utf-8")
      const lines = content.split("\n")

      result.fileSize = stats.size
      result.totalLines = lines.length
      result.firstLine = lines[0] || ""
      result.sampleLines = lines.slice(0, 3)
    }

    if (result.dataDirExists) {
      result.dataDirContents = fs.readdirSync(path.resolve(process.cwd(), "data"))
    }

    return NextResponse.json(result)
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
