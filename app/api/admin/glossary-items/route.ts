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
  try {
    const cookieStore = cookies()
    const authCookie = cookieStore.get("admin_auth")
    const isAuth = authCookie?.value === "true"
    return isAuth
  } catch (error) {
    console.error("Auth check error:", error)
    return false
  }
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
      console.error("CSV file not found at:", csvPath)
      return []
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.trim().split("\n")

    // Skip header row and empty lines
    const items: GlossaryItem[] = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

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

// Save all glossary items to CSV (with error handling for serverless)
function saveGlossaryItems(items: GlossaryItem[]): { success: boolean; error?: string } {
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

    // Try to write the file
    fs.writeFileSync(csvPath, csvContent, { encoding: "utf-8" })
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Error saving glossary items:", errorMessage)

    // Check if it's a read-only file system error (common in serverless)
    if (errorMessage.includes("EROFS") || errorMessage.includes("read-only")) {
      return {
        success: false,
        error: "Cannot save changes: This is a read-only environment. Changes will be lost when the server restarts.",
      }
    }

    return { success: false, error: errorMessage }
  }
}

// GET - Fetch all glossary items
export async function GET() {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const items = loadGlossaryItems()
    return NextResponse.json(items)
  } catch (error) {
    console.error("Error in GET handler:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - Add new glossary item
export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
    const itemToAdd = {
      letter: newItem.letter.toUpperCase(),
      term: newItem.term.trim(),
      definition: newItem.definition.trim(),
    }

    items.push(itemToAdd)

    // Try to save to CSV
    const saveResult = saveGlossaryItems(items)

    if (saveResult.success) {
      return NextResponse.json({ success: true, message: "Item added successfully" })
    } else {
      return NextResponse.json(
        {
          error: "Failed to save item",
          details: saveResult.error,
          warning: "The item was added to memory but cannot be permanently saved in this environment.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error adding item:", error)
    return NextResponse.json(
      {
        error: "Failed to add item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PUT - Update existing glossary item
export async function PUT(request: NextRequest) {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Try to save to CSV
    const saveResult = saveGlossaryItems(items)

    if (saveResult.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        {
          error: "Failed to update item",
          details: saveResult.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json(
      {
        error: "Failed to update item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE - Remove glossary item
export async function DELETE(request: NextRequest) {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { index }: { index: number } = await request.json()

    // Load existing items
    const items = loadGlossaryItems()

    // Validate index
    if (index < 0 || index >= items.length) {
      return NextResponse.json({ error: "Invalid item index" }, { status: 400 })
    }

    // Remove item
    items.splice(index, 1)

    // Try to save to CSV
    const saveResult = saveGlossaryItems(items)

    if (saveResult.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        {
          error: "Failed to delete item",
          details: saveResult.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error deleting item:", error)
    return NextResponse.json(
      {
        error: "Failed to delete item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
