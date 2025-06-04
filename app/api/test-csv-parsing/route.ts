import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  values.push(current.trim())

  // Clean up quoted values
  return values.map((val) => val.replace(/^"(.*)"$/, "$1"))
}

export async function GET() {
  try {
    console.log("=== TEST CSV PARSING START ===")

    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")
    console.log("CSV path:", csvPath)

    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: "CSV file not found", path: csvPath })
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.trim().split("\n")

    console.log("Total lines:", lines.length)
    console.log("Header line:", lines[0])

    // Test parsing first few lines
    const testResults = []
    for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
      const line = lines[i]
      console.log(`\nTesting line ${i}:`, line)

      try {
        const values = parseCSVLine(line)
        console.log(`Parsed values:`, values)

        const item = {
          letter: values[0] || "",
          term: values[1] || "",
          definition: values[2] || "",
          acronym: values[3] || undefined,
        }

        console.log(`Created item:`, item)
        testResults.push({
          lineNumber: i,
          rawLine: line,
          parsedValues: values,
          item: item,
          isValid: !!(item.letter && item.term && item.definition),
        })
      } catch (error) {
        console.log(`Error parsing line ${i}:`, error)
        testResults.push({
          lineNumber: i,
          rawLine: line,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Count items by letter
    const letterCounts: Record<string, number> = {}
    let totalValidItems = 0

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const values = parseCSVLine(line)
        if (values.length >= 3 && values[0] && values[1] && values[2]) {
          const letter = values[0].toUpperCase()
          letterCounts[letter] = (letterCounts[letter] || 0) + 1
          totalValidItems++
        }
      } catch (error) {
        continue
      }
    }

    console.log("Letter counts:", letterCounts)
    console.log("Total valid items:", totalValidItems)

    return NextResponse.json({
      csvPath,
      totalLines: lines.length,
      headerLine: lines[0],
      testResults,
      letterCounts,
      totalValidItems,
      availableLetters: Object.keys(letterCounts).sort(),
    })
  } catch (error) {
    console.error("Test CSV parsing error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
