import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { letter: string } }) {
  try {
    const letter = params.letter
    console.log("API: Loading items for letter:", letter)
    const { getGlossaryItemsByLetter } = await import("@/lib/csv-parser.server")
    const items = await getGlossaryItemsByLetter(letter)
    console.log("API: Found", items.length, "items for letter", letter)
    return NextResponse.json(items)
  } catch (error) {
    console.error(`API Error fetching glossary items for letter ${params.letter}:`, error)
    return NextResponse.json({ error: "Failed to fetch glossary items" }, { status: 500 })
  }
}
