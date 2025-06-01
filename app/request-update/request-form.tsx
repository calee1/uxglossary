"use client"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { submitUpdateRequest } from "./actions"

export function RequestForm() {
  const [state, action, isPending] = useActionState(submitUpdateRequest, null)

  return (
    <form action={action} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Your Name *
        </label>
        <Input type="text" id="name" name="name" required className="w-full" placeholder="Enter your full name" />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <Input type="email" id="email" name="email" required className="w-full" placeholder="your.email@example.com" />
      </div>

      <div>
        <label htmlFor="requestType" className="block text-sm font-medium text-gray-700 mb-2">
          Request Type *
        </label>
        <select
          id="requestType"
          name="requestType"
          required
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select request type</option>
          <option value="new-term">Add new term</option>
          <option value="update-definition">Update existing definition</option>
          <option value="correction">Report error/correction</option>
          <option value="removal">Request term removal</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="updateRequest" className="block text-sm font-medium text-gray-700 mb-2">
          Update Request Details *
        </label>
        <Textarea
          id="updateRequest"
          name="updateRequest"
          required
          rows={6}
          className="w-full"
          placeholder="Please provide detailed information about your request. Include:
- Term name (if applicable)
- Current definition (if updating)
- Proposed changes or new definition
- Any additional context or sources"
        />
      </div>

      <div>
        <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
          Source/Reference (Optional)
        </label>
        <Input
          type="text"
          id="source"
          name="source"
          className="w-full"
          placeholder="URL, book, article, or other reference"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3">
        {isPending ? "Submitting Request..." : "Submit Update Request"}
      </Button>

      {state?.success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✓ Request submitted successfully!</p>
          <p className="text-green-700 text-sm mt-1">Your request has been processed. Check the details below:</p>
          {state.debug && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono whitespace-pre-line">{state.debug}</div>
          )}
        </div>
      )}

      {state?.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">✗ Error submitting request</p>
          <p className="text-red-700 text-sm mt-1">{state.error}</p>
        </div>
      )}
    </form>
  )
}
