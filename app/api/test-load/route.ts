import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("=== TEST LOAD START ===")

    // Test 1: Check if we can import the function
    console.log("Step 1: Importing loadGlossaryData...")
    const { loadGlossaryData } = await import("@/lib/csv-parser.server")
    console.log("Step 1: Import successful")

    // Test 2: Try to call the function
    console.log("Step 2: Calling loadGlossaryData...")
    const data = await loadGlossaryData()
    console.log("Step 2: Function call completed")
    console.log("Step 2: Data keys:", Object.keys(data))
    console.log(
      "Step 2: Total items:",
      Object.values(data).reduce((sum, items) => sum + items.length, 0),
    )

    return NextResponse.json({
      success: true,
      dataKeys: Object.keys(data),
      totalItems: Object.values(data).reduce((sum, items) => sum + items.length, 0),
      sampleData: Object.entries(data)
        .slice(0, 3)
        .map(([letter, items]) => ({
          letter,
          count: items.length,
          firstTerm: items[0]?.term || "No terms",
        })),
    })
  } catch (error) {
    console.error("=== TEST LOAD ERROR ===")
    console.error("Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
