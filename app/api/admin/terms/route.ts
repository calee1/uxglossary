import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

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

// Helper function to load terms from GitHub
async function loadTermsFromGitHub(): Promise<{ terms: GlossaryItem[]; sha?: string }> {
  const githubToken = process.env.GITHUB_TOKEN
  const githubRepo = process.env.GITHUB_REPO
  const githubBranch = process.env.GITHUB_BRANCH || "main"

  if (!githubToken || !githubRepo) {
    throw new Error("GitHub configuration missing")
  }

  try {
    // Get the current file from GitHub
    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/data/glossary.csv?ref=${githubBranch}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "User-Agent": "UX-Glossary-Admin",
          Accept: "application/vnd.github.v3+json",
        },
      },
    )

    if (!response.ok) {
      if (response.status === 404) {
        // File doesn't exist yet, return empty
        return { terms: [] }
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const fileData = await response.json()
    const csvContent = Buffer.from(fileData.content, "base64").toString("utf-8")
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

    return { terms, sha: fileData.sha }
  } catch (error) {
    console.error("Error loading from GitHub:", error)
    throw error
  }
}

// Helper function to save terms to GitHub
async function saveTermsToGitHub(terms: GlossaryItem[], sha?: string): Promise<void> {
  const githubToken = process.env.GITHUB_TOKEN
  const githubRepo = process.env.GITHUB_REPO
  const githubBranch = process.env.GITHUB_BRANCH || "main"

  if (!githubToken || !githubRepo) {
    throw new Error("GitHub configuration missing")
  }

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

  // Prepare the commit data
  const commitData: any = {
    message: `Update glossary: ${new Date().toISOString()}`,
    content: Buffer.from(csvContent).toString("base64"),
    branch: githubBranch,
  }

  // Include SHA if updating existing file
  if (sha) {
    commitData.sha = sha
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${githubRepo}/contents/data/glossary.csv`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "UX-Glossary-Admin",
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commitData),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`GitHub API error: ${response.status} - ${errorData}`)
    }

    console.log("Successfully saved to GitHub")
  } catch (error) {
    console.error("Error saving to GitHub:", error)
    throw error
  }
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

    // Load existing terms from GitHub
    const { terms, sha } = await loadTermsFromGitHub()

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

    // Save to GitHub
    await saveTermsToGitHub(terms, sha)

    return NextResponse.json({ success: true, term: newTerm })
  } catch (error) {
    console.error("Error adding term:", error)
    return NextResponse.json(
      {
        error: "Failed to add term",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PUT - Update existing term
export async function PUT(request: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const updatedTerm: GlossaryItem & { originalTerm?: string } = await request.json()

    console.log("=== PUT REQUEST DEBUG ===")
    console.log("Received data:", JSON.stringify(updatedTerm, null, 2))

    // Validate required fields
    if (!updatedTerm.term || !updatedTerm.definition) {
      console.log("Validation failed: missing term or definition")
      return NextResponse.json({ error: "Term and definition are required" }, { status: 400 })
    }

    // Load existing terms from GitHub
    const { terms, sha } = await loadTermsFromGitHub()
    console.log("Total terms loaded from GitHub:", terms.length)

    // Find the term to update - use originalTerm if provided, otherwise use current term
    const searchTerm = updatedTerm.originalTerm || updatedTerm.term
    console.log("Searching for term:", searchTerm)

    // Try multiple search strategies
    let termIndex = -1

    // Strategy 1: Exact match with originalTerm
    if (updatedTerm.originalTerm) {
      termIndex = terms.findIndex((t) => t.term === updatedTerm.originalTerm)
      console.log("Strategy 1 (exact originalTerm match):", termIndex)
    }

    // Strategy 2: Case-insensitive match with originalTerm
    if (termIndex === -1 && updatedTerm.originalTerm) {
      termIndex = terms.findIndex((t) => t.term.toLowerCase() === updatedTerm.originalTerm.toLowerCase())
      console.log("Strategy 2 (case-insensitive originalTerm):", termIndex)
    }

    // Strategy 3: Exact match with current term
    if (termIndex === -1) {
      termIndex = terms.findIndex((t) => t.term === updatedTerm.term)
      console.log("Strategy 3 (exact current term):", termIndex)
    }

    // Strategy 4: Case-insensitive match with current term
    if (termIndex === -1) {
      termIndex = terms.findIndex((t) => t.term.toLowerCase() === updatedTerm.term.toLowerCase())
      console.log("Strategy 4 (case-insensitive current term):", termIndex)
    }

    console.log("Final term index found:", termIndex)

    if (termIndex === -1) {
      console.log("TERM NOT FOUND!")
      console.log("Available terms matching letter", updatedTerm.letter, ":")
      const matchingLetterTerms = terms.filter((t) => t.letter === updatedTerm.letter)
      console.log(matchingLetterTerms.map((t) => `"${t.term}"`))

      return NextResponse.json(
        {
          error: "Term not found",
          debug: {
            searchTerm,
            availableTermsForLetter: matchingLetterTerms.map((t) => t.term),
            totalTerms: terms.length,
          },
        },
        { status: 404 },
      )
    }

    console.log("Found term at index", termIndex, ":", terms[termIndex])

    // Update the term (remove originalTerm from the saved data)
    const { originalTerm, ...termToSave } = updatedTerm
    const oldTerm = { ...terms[termIndex] }
    terms[termIndex] = termToSave

    console.log("Old term:", oldTerm)
    console.log("New term:", terms[termIndex])

    // Save to GitHub
    await saveTermsToGitHub(terms, sha)
    console.log("Terms saved successfully to GitHub")

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

    // Load existing terms from GitHub
    const { terms, sha } = await loadTermsFromGitHub()

    // Find and remove the term
    const termIndex = terms.findIndex((t) => t.term.toLowerCase() === termName.toLowerCase())

    if (termIndex === -1) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 })
    }

    const deletedTerm = terms[termIndex]
    terms.splice(termIndex, 1)

    // Save to GitHub
    await saveTermsToGitHub(terms, sha)

    return NextResponse.json({ success: true, deletedTerm })
  } catch (error) {
    console.error("Error deleting term:", error)
    return NextResponse.json(
      {
        error: "Failed to delete term",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
