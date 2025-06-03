async function loadGlossaryDataSafe() {
  try {
    const { loadGlossaryData } = await import("@/lib/csv-parser.server")
    return await loadGlossaryData()
  } catch (error) {
    console.error("Failed to load glossary data:", error)
    return {}
  }
}

export default async function DebugPage() {
  const glossaryItems = await loadGlossaryDataSafe()
  const totalTerms = Object.values(glossaryItems).reduce((total, items) => total + items.length, 0)

  return (
    <main className="max-w-4xl mx-auto p-6 my-8">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <p>Total terms: {totalTerms}</p>
        <p>Letters with content: {Object.keys(glossaryItems).length}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Terms per letter</h2>
        <div className="grid grid-cols-4 gap-2 text-sm">
          {Object.entries(glossaryItems).map(([letter, items]) => (
            <div key={letter} className="p-2 border rounded">
              <strong>{letter}:</strong> {items.length} terms
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Sample terms from each letter</h2>
        {Object.entries(glossaryItems)
          .slice(0, 5)
          .map(([letter, items]) => (
            <div key={letter} className="mb-4 p-4 border rounded">
              <h3 className="font-semibold">Letter {letter} (showing first 3 terms):</h3>
              {items.slice(0, 3).map((item, index) => (
                <div key={index} className="ml-4 mt-2 text-sm">
                  <strong>{item.term}</strong>: {item.definition.substring(0, 100)}...
                </div>
              ))}
            </div>
          ))}
      </div>
    </main>
  )
}
