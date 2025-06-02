import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { cookies } from "next/headers"

interface GlossaryItem {
  letter: string
  term: string
  definition: string
}

// Check authentication
function isAuthenticated(): boolean {
  const cookieStore = cookies()
  const authCookie = cookieStore.get("admin-auth")
  return authCookie?.value === "authenticated"
}

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

// Convert item to CSV line with proper escaping
function itemToCSVLine(item: GlossaryItem): string {
  const escapedDefinition =
    item.definition.includes(",") || item.definition.includes('"') || item.definition.includes("\n")
      ? `"${item.definition.replace(/"/g, '""')}"`
      : item.definition

  return `${item.letter},${item.term},${escapedDefinition}`
}

// Load all glossary items from CSV
function loadGlossaryItems(): GlossaryItem[] {
  try {
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

    if (!fs.existsSync(csvPath)) {
      return []
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.trim().split("\n")

    // Skip header row
    const items: GlossaryItem[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length >= 3) {
        items.push({
          letter: values[0].trim(),
          term: values[1].trim(),
          definition: values[2].trim(),
        })
      }
    }

    return items
  } catch (error) {
    console.error("Error loading glossary items:", error)
    return []
  }
}

// Save all glossary items to CSV
function saveGlossaryItems(items: GlossaryItem[]): boolean {
  try {
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")

    // Create header
    let csvContent = "letter,term,definition\n"

    // Sort items by letter, then by term
    const sortedItems = items.sort((a, b) => {
      if (a.letter !== b.letter) {
        return a.letter.localeCompare(b.letter)
      }
      return a.term.localeCompare(b.term)
    })

    // Add each item
    sortedItems.forEach((item) => {
      csvContent += itemToCSVLine(item) + "\n"
    })

    fs.writeFileSync(csvPath, csvContent)
    return true
  } catch (error) {
    console.error("Error saving glossary items:", error)
    return false
  }
}

// GET - Fetch all glossary items
export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const items = loadGlossaryItems()
    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

// POST - Add new glossary item
export async function POST(request: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const newItem: GlossaryItem = await request.json()

    // Validate required fields
    if (!newItem.letter || !newItem.term || !newItem.definition) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Load existing items
    const items = loadGlossaryItems()

    // Check for duplicates
    const duplicate = items.find(
      (item) => item.letter === newItem.letter && item.term.toLowerCase() === newItem.term.toLowerCase(),
    )

    if (duplicate) {
      return NextResponse.json({ error: "Term already exists in this letter" }, { status: 400 })
    }

    // Add new item
    items.push({
      letter: newItem.letter.toUpperCase(),
      term: newItem.term.trim(),
      definition: newItem.definition.trim(),
    })

    // Save to CSV
    if (saveGlossaryItems(items)) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to save item" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error adding item:", error)
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 })
  }
}

// PUT - Update existing glossary item
export async function PUT(request: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { index, item }: { index: number; item: GlossaryItem } = await request.json()

    // Validate required fields
    if (!item.letter || !item.term || !item.definition) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Load existing items
    const items = loadGlossaryItems()

    // Validate index
    if (index < 0 || index >= items.length) {
      return NextResponse.json({ error: "Invalid item index" }, { status: 400 })
    }

    // Check for duplicates (excluding the item being edited)
    const duplicate = items.find(
      (existingItem, i) =>
        i !== index &&
        existingItem.letter === item.letter &&
        existingItem.term.toLowerCase() === item.term.toLowerCase(),
    )

    if (duplicate) {
      return NextResponse.json({ error: "Term already exists in this letter" }, { status: 400 })
    }

    // Update item
    items[index] = {
      letter: item.letter.toUpperCase(),
      term: item.term.trim(),
      definition: item.definition.trim(),
    }

    // Save to CSV
    if (saveGlossaryItems(items)) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

// DELETE - Remove glossary item
export async function DELETE(request: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { index }: { index: number } = await request.json()

    // Load existing items
    const items = loadGlossaryItems()

    // Validate index
    if (index < 0 || index >= items.length) {
      return NextResponse.json({ error: "Invalid item index" }, { status: 400 })
    }

    // Remove item
    items.splice(index, 1)

    // Save to CSV
    if (saveGlossaryItems(items)) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error deleting item:", error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
