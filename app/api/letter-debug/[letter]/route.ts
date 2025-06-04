import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { letter: string } }) {
  try {
    const letterParam = params.letter
    const letter = letterParam === "0-9" ? "0" : letterParam.toUpperCase()

    console.log("Letter debug API called with:", letterParam, "->", letter)

    const { loadGlossaryData } = await import("@/lib/csv-parser.server")
    const data = await loadGlossaryData()

    const items = data[letter] || []

    return NextResponse.json({
      urlParam: letterParam,
      lookupKey: letter,
      availableLetters: Object.keys(data),
      itemsFound: items.length,
      firstFewItems: items.slice(0, 3).map((item) => ({
        term: item.term,
        definition: item.definition.substring(0, 50) + "...",
      })),
      sampleFromA: data["A"]?.slice(0, 2).map((item) => item.term) || [],
      sampleFromB: data["B"]?.slice(0, 2).map((item) => item.term) || [],
    })
  } catch (error) {
    console.error(`Letter debug API error for ${params.letter}:`, error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
