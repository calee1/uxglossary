import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
    }

    console.log("API: Searching for:", query)
    const { searchGlossaryItems } = await import("@/lib/csv-parser.server")
    const results = await searchGlossaryItems(query)
    console.log("API: Found", results.length, "results")
    return NextResponse.json(results)
  } catch (error) {
    console.error("API Error searching glossary:", error)
    return NextResponse.json({ error: "Failed to search glossary" }, { status: 500 })
  }
}
