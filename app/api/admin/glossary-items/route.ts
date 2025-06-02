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
    console.log("Authentication check - cookie value:", authCookie?.value, "isAuth:", isAuth)
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
    console.log("Looking for CSV file at:", csvPath)

    if (!fs.existsSync(csvPath)) {
      console.error("CSV file not found at:", csvPath)

      // Try alternative paths
      const altPath1 = path.join(process.cwd(), "data", "glossary.csv")

      console.log("Trying alternative path 1:", altPath1, "exists:", fs.existsSync(altPath1))

      // List contents of data directory if it exists
      const dataDir = path.resolve(process.cwd(), "data")
      if (fs.existsSync(dataDir)) {
        console.log("Data directory contents:", fs.readdirSync(dataDir))
      } else {
        console.log("Data directory does not exist at:", dataDir)
      }

      return []
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    console.log("CSV file size:", csvContent.length, "characters")

    const lines = csvContent.trim().split("\n")
    console.log(`CSV loaded with ${lines.length} lines (including header)`)

    // Skip header row
    const items: GlossaryItem[] = []

    for (let i = 1; i < lines.length; i++) {
      // Skip empty lines
      if (!lines[i].trim()) continue

      const values = parseCSVLine(lines[i])
      if (values.length >= 3) {
        items.push({
          letter: values[0].trim(),
          term: values[1].trim(),
          definition: values[2].trim(),
        })
      } else {
        console.warn(`Line ${i + 1} has invalid format (${values.length} columns):`, lines[i])
      }
    }

    console.log(`Successfully parsed ${items.length} glossary items`)
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
    console.log("Attempting to save to:", csvPath)

    // Check if we can write to the file
    try {
      fs.accessSync(path.dirname(csvPath), fs.constants.W_OK)
      console.log("Directory is writable")
    } catch (error) {
      console.error("Directory is not writable:", error)
      return false
    }

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
    console.log(`Successfully saved ${items.length} glossary items to CSV`)

    // Verify the file was written correctly
    const verifyContent = fs.readFileSync(csvPath, "utf-8")
    const verifyLines = verifyContent.trim().split("\n")
    console.log(`Verification: File has ${verifyLines.length} lines`)

    return true
  } catch (error) {
    console.error("Error saving glossary items:", error)
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as any)?.code,
      errno: (error as any)?.errno,
      syscall: (error as any)?.syscall,
      path: (error as any)?.path,
    })
    return false
  }
}

// GET - Fetch all glossary items
export async function GET() {
  console.log("GET /api/admin/glossary-items called")

  if (!isAuthenticated()) {
    console.log("Authentication failed - returning 401")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("Authentication successful, loading glossary items...")
    const items = loadGlossaryItems()
    console.log(`Returning ${items.length} glossary items`)

    return NextResponse.json(items, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
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
  console.log("POST /api/admin/glossary-items called")

  if (!isAuthenticated()) {
    console.log("Authentication failed for POST")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const newItem: GlossaryItem = await request.json()
    console.log("Adding new item:", newItem)

    // Validate required fields
    if (!newItem.letter || !newItem.term || !newItem.definition) {
      console.log("Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Load existing items
    console.log("Loading existing items...")
    const items = loadGlossaryItems()
    console.log(`Loaded ${items.length} existing items`)

    // Check for duplicates
    const duplicate = items.find(
      (item) => item.letter === newItem.letter && item.term.toLowerCase() === newItem.term.toLowerCase(),
    )

    if (duplicate) {
      console.log("Duplicate term found:", duplicate)
      return NextResponse.json({ error: "Term already exists in this letter" }, { status: 400 })
    }

    // Add new item
    const itemToAdd = {
      letter: newItem.letter.toUpperCase(),
      term: newItem.term.trim(),
      definition: newItem.definition.trim(),
    }

    items.push(itemToAdd)
    console.log("Item added to array, total items:", items.length)

    // Save to CSV
    console.log("Attempting to save to CSV...")
    const saveResult = saveGlossaryItems(items)
    console.log("Save result:", saveResult)

    if (saveResult) {
      console.log("Successfully saved item")
      return NextResponse.json({ success: true, message: "Item added successfully" })
    } else {
      console.log("Failed to save item")
      return NextResponse.json(
        {
          error: "Failed to save item",
          details:
            "Unable to write to CSV file. This might be due to file permissions or serverless environment limitations.",
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
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { index, item }: { index: number; item: GlossaryItem } = await request.json()
    console.log("Updating item at index:", index, "with:", item)

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
    console.log("Deleting item at index:", index)

    // Load existing items
    const items = loadGlossaryItems()

    // Validate index
    if (index < 0 || index >= items.length) {
      return NextResponse.json({ error: "Invalid item index" }, { status: 400 })
    }

    const itemToDelete = items[index]
    console.log("Deleting item:", itemToDelete)

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
