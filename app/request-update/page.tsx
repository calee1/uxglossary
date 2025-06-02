import { RequestForm } from "./request-form"
import Link from "next/link"

export default function RequestUpdatePage() {
  return (
    <main className="max-w-2xl mx-auto p-6 border rounded-lg my-8 bg-white">
      <div className="mb-6">
        <Link href="/" className="text-blue-500 hover:underline text-sm">
          ← Back to UX Glossary
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Request an Update</h1>
        <p className="text-gray-600">
          Help improve this glossary by suggesting new terms, corrections, or updates to existing definitions.
        </p>
      </div>

      <RequestForm />

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Your request will be emailed to c***7@gmail.com for review</li>
          <li>• We'll contact you directly using the email you provided</li>
          <li>• Updates are typically processed within 5-7 business days</li>
          <li>• You'll receive a confirmation email once changes are made</li>
        </ul>
      </div>
    </main>
  )
}
