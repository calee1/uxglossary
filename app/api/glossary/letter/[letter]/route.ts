import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { letter: string } }) {
  try {
    const letter = params.letter
    const { getGlossaryItemsByLetter } = await import("@/lib/csv-parser.server")
    const items = await getGlossaryItemsByLetter(letter)
    return NextResponse.json(items)
  } catch (error) {
    console.error(`Error fetching glossary items for letter ${params.letter}:`, error)
    return NextResponse.json({ error: "Failed to fetch glossary items" }, { status: 500 })
  }
}
