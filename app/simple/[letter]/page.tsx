import Link from "next/link"
import { getItemsByLetter } from "@/lib/simple-parser"

export default async function SimplePage({ params }: { params: { letter: string } }) {
  // Convert 0-9 to 0
  const letter = params.letter === "0-9" ? "0" : params.letter.toUpperCase()

  // Get items for this letter
  const items = await getItemsByLetter(letter)

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-6">Letter {letter}</h1>

      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <strong>Debug:</strong> Found {items.length} items for letter {letter}
      </div>

      {items.length === 0 ? (
        <p>No items found for this letter.</p>
      ) : (
        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="p-4 border rounded">
              <h2 className="text-xl font-bold">{item.term}</h2>
              {item.acronym && <p className="text-sm text-blue-600">{item.acronym}</p>}
              <p className="mt-2">{item.definition}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/" className="text-blue-500 hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
