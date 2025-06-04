import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

interface GlossaryItem {
  letter: string
  term: string
  definition: string
  acronym?: string
}

export async function GET(request: Request, { params }: { params: { letter: string } }) {
  try {
    const letterParam = params.letter
    const letter = letterParam === "0-9" ? "0" : letterParam.toUpperCase()

    console.log("Direct letter API called with:", letterParam, "->", letter)

    // Direct file access to bypass any potential issues with the parser
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

    // Parse directly in this function
    const items: GlossaryItem[] = []

    // Skip header (line 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const values = line.split(",").map((v) => v.trim())

        if (values.length >= 3) {
          const itemLetter = values[0].toUpperCase()

          // Only include items for the requested letter
          if (itemLetter === letter) {
            items.push({
              letter: itemLetter,
              term: values[1],
              definition: values[2],
              acronym: values[3] || undefined,
            })
          }
        }
      } catch (error) {
        continue
      }
    }

    return NextResponse.json({
      letter: letter,
      itemCount: items.length,
      items: items.slice(0, 10), // Return first 10 items
      csvInfo: {
        path: csvPath,
        totalLines: lines.length,
        firstLine: lines[0],
      },
    })
  } catch (error) {
    console.error(`Direct letter API error for ${params.letter}:`, error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
