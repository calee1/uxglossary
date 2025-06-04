import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import fs from "fs"
import path from "path"

// Check authentication
function isAuthenticated(): boolean {
  try {
    const cookieStore = cookies()
    const authCookie = cookieStore.get("admin_auth")
    return authCookie?.value === "true"
  } catch (error) {
    console.error("Auth check error:", error)
    return false
  }
}

interface GlossaryItem {
  letter: string
  term: string
  definition: string
  acronym?: string
}

// Helper function to parse CSV
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
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
  return values.map((val) => val.replace(/^"(.*)"$/, "$1"))
}

// Helper function to escape CSV values
function escapeCSVValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// Helper function to convert item to CSV line
function itemToCSVLine(item: GlossaryItem): string {
  return [item.letter, escapeCSVValue(item.term), escapeCSVValue(item.definition), item.acronym || ""].join(",")
}

// Helper function to load all terms
function loadAllTerms(): GlossaryItem[] {
  const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

  if (!fs.existsSync(csvPath)) {
    return []
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8")
  const lines = csvContent.trim().split("\n")
  const terms: GlossaryItem[] = []

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const values = parseCSVLine(line)
      if (values.length >= 3) {
        terms.push({
          letter: values[0],
          term: values[1],
          definition: values[2],
          acronym: values[3] || undefined,
        })
      }
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error)
    }
  }

  return terms
}

// Helper function to save all terms
function saveAllTerms(terms: GlossaryItem[]): void {
  const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

  // Sort terms by letter, then by term
  const sortedTerms = terms.sort((a, b) => {
    if (a.letter !== b.letter) {
      return a.letter.localeCompare(b.letter)
    }
    return a.term.localeCompare(b.term)
  })

  // Create CSV content
  let csvContent = "letter,term,definition,acronym\n"
  for (const term of sortedTerms) {
    csvContent += itemToCSVLine(term) + "\n"
  }

  // Create backup
  if (fs.existsSync(csvPath)) {
    const backupPath = `${csvPath}.backup-${Date.now()}`
    fs.copyFileSync(csvPath, backupPath)
  }

  // Write new content
  fs.writeFileSync(csvPath, csvContent, "utf-8")
}

// POST - Add new term
export async function POST(request: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const newTerm: GlossaryItem = await request.json()

    // Validate required fields
    if (!newTerm.term || !newTerm.definition) {
      return NextResponse.json({ error: "Term and definition are required" }, { status: 400 })
    }

    // Load existing terms
    const terms = loadAllTerms()

    // Check for duplicates
    const existingTerm = terms.find((t) => t.term.toLowerCase() === newTerm.term.toLowerCase())
    if (existingTerm) {
      return NextResponse.json({ error: "Term already exists" }, { status: 409 })
    }

    // Determine letter if not provided
    if (!newTerm.letter) {
      const firstChar = newTerm.term.charAt(0).toUpperCase()
      newTerm.letter = /\d/.test(firstChar) ? "0" : firstChar
    }

    // Add new term
    terms.push(newTerm)

    // Save to file
    saveAllTerms(terms)

    return NextResponse.json({ success: true, term: newTerm })
  } catch (error) {
    console.error("Error adding term:", error)
    return NextResponse.json({ error: "Failed to add term" }, { status: 500 })
  }
}

// PUT - Update existing term
export async function PUT(request: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const updatedTerm: GlossaryItem & { originalTerm?: string } = await request.json()

    console.log("PUT request received:", updatedTerm)

    // Validate required fields
    if (!updatedTerm.term || !updatedTerm.definition) {
      return NextResponse.json({ error: "Term and definition are required" }, { status: 400 })
    }

    // Load existing terms
    const terms = loadAllTerms()
    console.log("Loaded terms count:", terms.length)

    // Find the term to update - use originalTerm if provided, otherwise use current term
    const searchTerm = updatedTerm.originalTerm || updatedTerm.term
    const termIndex = terms.findIndex(
      (t) =>
        t.term.toLowerCase() === searchTerm.toLowerCase() ||
        (t.term.toLowerCase() === updatedTerm.term.toLowerCase() && t.letter === updatedTerm.letter),
    )

    console.log("Searching for term:", searchTerm)
    console.log("Term index found:", termIndex)

    if (termIndex === -1) {
      console.log("Available terms:", terms.map((t) => `${t.letter}: ${t.term}`).slice(0, 10))
      return NextResponse.json({ error: "Term not found" }, { status: 404 })
    }

    // Update the term (remove originalTerm from the saved data)
    const { originalTerm, ...termToSave } = updatedTerm
    terms[termIndex] = termToSave

    console.log("Updated term:", terms[termIndex])

    // Save to file
    saveAllTerms(terms)

    return NextResponse.json({ success: true, term: termToSave })
  } catch (error) {
    console.error("Error updating term:", error)
    return NextResponse.json(
      {
        error: "Failed to update term",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE - Remove term
export async function DELETE(request: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { term: termName } = await request.json()

    if (!termName) {
      return NextResponse.json({ error: "Term name is required" }, { status: 400 })
    }

    // Load existing terms
    const terms = loadAllTerms()

    // Find and remove the term
    const termIndex = terms.findIndex((t) => t.term.toLowerCase() === termName.toLowerCase())

    if (termIndex === -1) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 })
    }

    const deletedTerm = terms[termIndex]
    terms.splice(termIndex, 1)

    // Save to file
    saveAllTerms(terms)

    return NextResponse.json({ success: true, deletedTerm })
  } catch (error) {
    console.error("Error deleting term:", error)
    return NextResponse.json({ error: "Failed to delete term" }, { status: 500 })
  }
}
