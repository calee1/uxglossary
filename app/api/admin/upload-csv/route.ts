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

// Enhanced CSV parser that properly handles quoted fields
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Handle escaped quotes (double quotes within quoted field)
        current += '"'
        i++ // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      // Field separator outside of quotes
      values.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  // Add the last field
  values.push(current.trim())

  // Clean up quoted values - remove surrounding quotes but keep internal content
  return values.map((val) => {
    const trimmed = val.trim()
    if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
      return trimmed.slice(1, -1) // Remove surrounding quotes
    }
    return trimmed
  })
}

// Helper function to escape CSV values with proper quoting
function escapeCSVValue(value: string): string {
  // Always quote term and definition fields, escape internal quotes
  const escaped = value.replace(/"/g, '""')
  return `"${escaped}"`
}

// Helper function to convert item to CSV line with proper quoting
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

  // Create CSV content with proper quoting
  let csvContent = 'letter,"term","definition",acronym\n'
  for (const term of sortedTerms) {
    csvContent += itemToCSVLine(term) + "\n"
  }

  // Prepare the commit data
  const commitData: any = {
    message: `Bulk update glossary via CSV upload: ${new Date().toISOString()}`,
    content: Buffer.from(csvContent).toString("base64"),
    branch: githubBranch,
  }

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

export async function POST(request: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("csv") as File

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file provided",
        },
        { status: 400 },
      )
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        {
          success: false,
          message: "File must be a CSV",
        },
        { status: 400 },
      )
    }

    // Read and parse the CSV file
    const csvContent = await file.text()
    const lines = csvContent.trim().split("\n")

    if (lines.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "CSV file must have at least a header and one data row",
        },
        { status: 400 },
      )
    }

    // Validate header - check for quoted format
    const header = lines[0].toLowerCase().trim()
    const expectedFormats = [
      'letter,"term","definition",acronym',
      "letter,term,definition,acronym",
      '"letter","term","definition","acronym"',
    ]

    const headerValid = expectedFormats.some(
      (format) => header === format || (header.includes('"term"') && header.includes('"definition"')),
    )

    if (!headerValid) {
      return NextResponse.json(
        {
          success: false,
          message: `CSV header must be in format: letter,"term","definition",acronym`,
        },
        { status: 400 },
      )
    }

    // Parse CSV data
    const newTerms: GlossaryItem[] = []
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const values = parseCSVLine(line)

        if (values.length < 3) {
          errors.push(`Line ${i + 1}: Missing required columns`)
          continue
        }

        const [letter, term, definition, acronym] = values

        if (!letter || !term || !definition) {
          errors.push(`Line ${i + 1}: Letter, term, and definition are required`)
          continue
        }

        // Validate letter
        const normalizedLetter = letter.toUpperCase()
        if (!/^[A-Z0]$/.test(normalizedLetter)) {
          errors.push(`Line ${i + 1}: Letter must be A-Z or 0`)
          continue
        }

        newTerms.push({
          letter: normalizedLetter,
          term: term.trim(),
          definition: definition.trim(),
          acronym: acronym?.trim() || undefined,
        })
      } catch (error) {
        errors.push(`Line ${i + 1}: Parse error - ${error}`)
      }
    }

    if (newTerms.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid terms found in CSV",
          errors,
        },
        { status: 400 },
      )
    }

    // Load existing terms
    const { terms: existingTerms, sha } = await loadTermsFromGitHub()

    // Merge terms (update existing, add new)
    const termMap = new Map<string, GlossaryItem>()
    let addedCount = 0
    let updatedCount = 0

    // Add existing terms to map
    existingTerms.forEach((term) => {
      termMap.set(term.term.toLowerCase(), term)
    })

    // Process new terms
    newTerms.forEach((newTerm) => {
      const key = newTerm.term.toLowerCase()
      if (termMap.has(key)) {
        updatedCount++
      } else {
        addedCount++
      }
      termMap.set(key, newTerm)
    })

    // Convert back to array
    const finalTerms = Array.from(termMap.values())

    // Save to GitHub
    await saveTermsToGitHub(finalTerms, sha)

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${newTerms.length} terms from CSV`,
      added: addedCount,
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Error processing CSV upload:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process CSV file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
