import Link from "next/link"

export default function NotFound() {
  return (
    <main className="max-w-4xl mx-auto p-6 border rounded-lg my-8 bg-white">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Letter Not Found</h1>
        <p className="text-gray-600 mb-6">The letter you're looking for doesn't exist or isn't valid.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Return to Glossary
        </Link>
      </div>
    </main>
  )
}
