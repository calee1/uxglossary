import { type NextRequest, NextResponse } from "next/server"
import { searchGlossaryItems } from "@/lib/csv-parser"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
    }

    const results = await searchGlossaryItems(query)
    return NextResponse.json(results)
  } catch (error) {
    console.error("Error searching glossary:", error)
    return NextResponse.json({ error: "Failed to search glossary" }, { status: 500 })
  }
}
