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
    console.log("Auth check result:", isAuth)
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
    console.log("Loading glossary items from CSV...")
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")
    console.log("CSV path:", csvPath)

    if (!fs.existsSync(csvPath)) {
      console.error("CSV file not found at:", csvPath)
      return []
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    console.log("CSV content length:", csvContent.length)

    const lines = csvContent.trim().split("\n")
    console.log("CSV lines count:", lines.length)

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

    console.log("Loaded items count:", items.length)
    return items
  } catch (error) {
    console.error("Error loading glossary items:", error)
    return []
  }
}

// Update CSV file via GitHub API
async function updateCSVViaGitHub(items: GlossaryItem[]): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    console.log("=== Starting GitHub API Update ===")

    const githubToken = process.env.GITHUB_TOKEN
    const githubRepo = process.env.GITHUB_REPO // format: "username/repo-name"
    const githubBranch = process.env.GITHUB_BRANCH || "main"

    console.log("Environment check:")
    console.log("- Token exists:", !!githubToken)
    console.log("- Token length:", githubToken?.length || 0)
    console.log("- Token prefix:", githubToken?.substring(0, 20) + "...")
    console.log("- Repo:", githubRepo)
    console.log("- Branch:", githubBranch)

    if (!githubToken) {
      const error = "GITHUB_TOKEN environment variable is not set"
      console.error(error)
      return { success: false, error }
    }

    if (!githubRepo) {
      const error = "GITHUB_REPO environment variable is not set"
      console.error(error)
      return { success: false, error }
    }

    // Create CSV content
    console.log("Creating CSV content...")
    let csvContent = "letter,term,definition\n"
    const sortedItems = items.sort((a, b) => {
      if (a.letter !== b.letter) {
        return a.letter.localeCompare(b.letter)
      }
      return a.term.localeCompare(b.term)
    })

    sortedItems.forEach((item) => {
      csvContent += itemToCSVLine(item) + "\n"
    })

    console.log("CSV content created, length:", csvContent.length)
    console.log("First 200 chars:", csvContent.substring(0, 200))

    // Step 1: Test basic GitHub API access
    console.log("Step 1: Testing basic GitHub API access...")
    const repoUrl = `https://api.github.com/repos/${githubRepo}`
    console.log("Testing repo URL:", repoUrl)

    const repoResponse = await fetch(repoUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "UX-Glossary-Admin",
        Accept: "application/vnd.github.v3+json",
      },
    })

    console.log("Repo response status:", repoResponse.status)

    if (!repoResponse.ok) {
      const errorText = await repoResponse.text()
      console.error("Repo access failed:", errorText)
      return {
        success: false,
        error: `Cannot access repository: ${repoResponse.status}`,
        details: { status: repoResponse.status, response: errorText },
      }
    }

    const repoData = await repoResponse.json()
    console.log("Repo access successful. Repo name:", repoData.name)

    // Step 2: Get current file SHA (if exists)
    console.log("Step 2: Getting current file SHA...")
    const getFileUrl = `https://api.github.com/repos/${githubRepo}/contents/data/glossary.csv?ref=${githubBranch}`
    console.log("Get file URL:", getFileUrl)

    const getFileResponse = await fetch(getFileUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "UX-Glossary-Admin",
        Accept: "application/vnd.github.v3+json",
      },
    })

    console.log("Get file response status:", getFileResponse.status)

    let sha = ""
    if (getFileResponse.ok) {
      const fileData = await getFileResponse.json()
      sha = fileData.sha
      console.log("Current file SHA:", sha)
    } else if (getFileResponse.status === 404) {
      console.log("File doesn't exist yet, will create new file")
    } else {
      const errorText = await getFileResponse.text()
      console.error("Error fetching file:", getFileResponse.status, errorText)
      return {
        success: false,
        error: `Failed to fetch current file: ${getFileResponse.status}`,
        details: { status: getFileResponse.status, response: errorText },
      }
    }

    // Step 3: Update/create file
    console.log("Step 3: Updating/creating file...")
    const updateUrl = `https://api.github.com/repos/${githubRepo}/contents/data/glossary.csv`
    console.log("Update URL:", updateUrl)

    const updatePayload = {
      message: `Update glossary: ${items.length} terms`,
      content: Buffer.from(csvContent).toString("base64"),
      branch: githubBranch,
      ...(sha && { sha }), // Only include SHA if file exists
    }

    console.log("Update payload prepared:")
    console.log("- Message:", updatePayload.message)
    console.log("- Content length (base64):", updatePayload.content.length)
    console.log("- Branch:", updatePayload.branch)
    console.log("- Has SHA:", !!sha)

    const updateResponse = await fetch(updateUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
        "User-Agent": "UX-Glossary-Admin",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify(updatePayload),
    })

    console.log("Update response status:", updateResponse.status)

    if (updateResponse.ok) {
      const responseData = await updateResponse.json()
      console.log("Successfully updated CSV via GitHub API")
      console.log("Commit SHA:", responseData.commit?.sha)
      return { success: true }
    } else {
      const errorData = await updateResponse.text()
      console.error("GitHub API update error:", updateResponse.status, errorData)

      let parsedError
      try {
        parsedError = JSON.parse(errorData)
      } catch {
        parsedError = errorData
      }

      return {
        success: false,
        error: `GitHub API error: ${updateResponse.status}`,
        details: {
          status: updateResponse.status,
          response: parsedError,
          url: updateUrl,
        },
      }
    }
  } catch (error) {
    console.error("Error in updateCSVViaGitHub:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: {
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      },
    }
  }
}

// GET - Fetch all glossary items
export async function GET() {
  try {
    console.log("=== GET /api/admin/glossary-items ===")

    if (!isAuthenticated()) {
      console.log("Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const items = loadGlossaryItems()
    console.log("Returning", items.length, "items")
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
    console.log("=== POST /api/admin/glossary-items ===")

    // Step 1: Check authentication
    console.log("Step 1: Checking authentication...")
    if (!isAuthenticated()) {
      console.log("Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("Authentication successful")

    // Step 2: Parse request body
    console.log("Step 2: Parsing request body...")
    let newItem: GlossaryItem
    try {
      newItem = await request.json()
      console.log("Request body parsed:", {
        letter: newItem.letter,
        term: newItem.term,
        definitionLength: newItem.definition?.length,
      })
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Step 3: Validate required fields
    console.log("Step 3: Validating required fields...")
    if (!newItem.letter || !newItem.term || !newItem.definition) {
      console.log("Validation failed - missing fields:", {
        hasLetter: !!newItem.letter,
        hasTerm: !!newItem.term,
        hasDefinition: !!newItem.definition,
      })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    console.log("Validation successful")

    // Step 4: Load existing items
    console.log("Step 4: Loading existing items...")
    const items = loadGlossaryItems()
    console.log("Loaded", items.length, "existing items")

    // Step 5: Check for duplicates
    console.log("Step 5: Checking for duplicates...")
    const duplicate = items.find(
      (item) => item.letter === newItem.letter && item.term.toLowerCase() === newItem.term.toLowerCase(),
    )

    if (duplicate) {
      console.log("Duplicate found:", duplicate.term)
      return NextResponse.json({ error: "Term already exists in this letter" }, { status: 400 })
    }
    console.log("No duplicates found")

    // Step 6: Add new item
    console.log("Step 6: Adding new item...")
    const itemToAdd = {
      letter: newItem.letter.toUpperCase(),
      term: newItem.term.trim(),
      definition: newItem.definition.trim(),
    }

    items.push(itemToAdd)
    console.log("Item added to array, total items:", items.length)

    // Step 7: Save via GitHub API
    console.log("Step 7: Saving via GitHub API...")
    const saveResult = await updateCSVViaGitHub(items)

    if (saveResult.success) {
      console.log("Successfully saved to GitHub")
      return NextResponse.json({
        success: true,
        message: "Item added successfully and saved to repository",
      })
    } else {
      console.error("Failed to save to GitHub:", saveResult.error)
      return NextResponse.json(
        {
          error: "Failed to save item to repository",
          details: saveResult.error,
          debugInfo: saveResult.details,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in POST handler:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// PUT - Update existing glossary item
export async function PUT(request: NextRequest) {
  try {
    console.log("=== PUT /api/admin/glossary-items ===")

    // Step 1: Check authentication
    console.log("Step 1: Checking authentication...")
    if (!isAuthenticated()) {
      console.log("Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("Authentication successful")

    // Step 2: Parse request body
    console.log("Step 2: Parsing request body...")
    let requestData: { index: number; item: GlossaryItem }
    try {
      requestData = await request.json()
      console.log("Request body parsed:", {
        index: requestData.index,
        letter: requestData.item?.letter,
        term: requestData.item?.term,
        definitionLength: requestData.item?.definition?.length,
      })
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { index, item } = requestData

    // Step 3: Validate required fields
    console.log("Step 3: Validating required fields...")
    if (typeof index !== "number" || !item || !item.letter || !item.term || !item.definition) {
      console.log("Validation failed - missing fields:", {
        hasIndex: typeof index === "number",
        hasItem: !!item,
        hasLetter: !!item?.letter,
        hasTerm: !!item?.term,
        hasDefinition: !!item?.definition,
      })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    console.log("Validation successful")

    // Step 4: Load existing items
    console.log("Step 4: Loading existing items...")
    const items = loadGlossaryItems()
    console.log("Loaded", items.length, "existing items")

    // Step 5: Validate index
    console.log("Step 5: Validating index...")
    if (index < 0 || index >= items.length) {
      console.log("Invalid index:", index, "- array length:", items.length)
      return NextResponse.json({ error: "Invalid item index" }, { status: 400 })
    }
    console.log("Index validation successful")

    // Step 6: Check for duplicates (excluding the item being edited)
    console.log("Step 6: Checking for duplicates...")
    const duplicate = items.find(
      (existingItem, i) =>
        i !== index &&
        existingItem.letter === item.letter &&
        existingItem.term.toLowerCase() === item.term.toLowerCase(),
    )

    if (duplicate) {
      console.log("Duplicate found:", duplicate.term)
      return NextResponse.json({ error: "Term already exists in this letter" }, { status: 400 })
    }
    console.log("No duplicates found")

    // Step 7: Update item
    console.log("Step 7: Updating item...")
    const oldItem = items[index]
    console.log("Old item:", oldItem)

    items[index] = {
      letter: item.letter.toUpperCase(),
      term: item.term.trim(),
      definition: item.definition.trim(),
    }

    console.log("New item:", items[index])

    // Step 8: Save via GitHub API
    console.log("Step 8: Saving via GitHub API...")
    const saveResult = await updateCSVViaGitHub(items)

    if (saveResult.success) {
      console.log("Successfully saved to GitHub")
      return NextResponse.json({
        success: true,
        message: "Item updated successfully and saved to repository",
      })
    } else {
      console.error("Failed to save to GitHub:", saveResult.error)
      return NextResponse.json(
        {
          error: "Failed to update item in repository",
          details: saveResult.error,
          debugInfo: saveResult.details,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in PUT handler:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// DELETE - Remove glossary item
export async function DELETE(request: NextRequest) {
  try {
    console.log("=== DELETE /api/admin/glossary-items ===")

    // Step 1: Check authentication
    console.log("Step 1: Checking authentication...")
    if (!isAuthenticated()) {
      console.log("Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("Authentication successful")

    // Step 2: Parse request body
    console.log("Step 2: Parsing request body...")
    let requestData: { index: number }
    try {
      requestData = await request.json()
      console.log("Request body parsed:", { index: requestData.index })
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { index } = requestData

    // Step 3: Validate index type
    console.log("Step 3: Validating index...")
    if (typeof index !== "number") {
      console.log("Invalid index type:", typeof index)
      return NextResponse.json({ error: "Invalid index type" }, { status: 400 })
    }

    // Step 4: Load existing items
    console.log("Step 4: Loading existing items...")
    const items = loadGlossaryItems()
    console.log("Loaded", items.length, "existing items")

    // Step 5: Validate index range
    console.log("Step 5: Validating index range...")
    if (index < 0 || index >= items.length) {
      console.log("Invalid index:", index, "- array length:", items.length)
      return NextResponse.json({ error: "Invalid item index" }, { status: 400 })
    }
    console.log("Index validation successful")

    // Step 6: Remove item
    console.log("Step 6: Removing item...")
    const removedItem = items[index]
    console.log("Removing item:", removedItem)

    items.splice(index, 1)
    console.log("Item removed, new total:", items.length)

    // Step 7: Save via GitHub API
    console.log("Step 7: Saving via GitHub API...")
    const saveResult = await updateCSVViaGitHub(items)

    if (saveResult.success) {
      console.log("Successfully saved to GitHub")
      return NextResponse.json({
        success: true,
        message: "Item deleted successfully and saved to repository",
      })
    } else {
      console.error("Failed to save to GitHub:", saveResult.error)
      return NextResponse.json(
        {
          error: "Failed to delete item from repository",
          details: saveResult.error,
          debugInfo: saveResult.details,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in DELETE handler:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
