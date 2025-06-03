import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Dynamic import to avoid build-time issues
    const { getGlossaryItems } = await import("@/lib/csv-parser.server")
    const items = await getGlossaryItems()
    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching glossary items:", error)
    return NextResponse.json({ error: "Failed to fetch glossary items" }, { status: 500 })
  }
}
