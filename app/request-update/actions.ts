"use server"

import fs from "fs"
import path from "path"

interface RequestState {
  success?: boolean
  error?: string
}

export async function submitUpdateRequest(prevState: RequestState | null, formData: FormData): Promise<RequestState> {
  try {
    // Extract form data
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const requestType = formData.get("requestType") as string
    const updateRequest = formData.get("updateRequest") as string
    const source = formData.get("source") as string

    // Validate required fields
    if (!name || !email || !requestType || !updateRequest) {
      return { error: "Please fill in all required fields." }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "Please enter a valid email address." }
    }

    // Prepare CSV data
    const timestamp = new Date().toISOString()
    const csvRow = [
      timestamp,
      escapeCSVField(name),
      escapeCSVField(email),
      escapeCSVField(requestType),
      escapeCSVField(updateRequest),
      escapeCSVField(source || ""),
      "pending", // status
    ].join(",")

    // Ensure data directory exists
    const dataDir = path.resolve(process.cwd(), "data")
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Check if requests file exists, create with headers if not
    const requestsPath = path.resolve(dataDir, "update-requests.csv")
    if (!fs.existsSync(requestsPath)) {
      const headers = "timestamp,name,email,request_type,update_request,source,status\n"
      fs.writeFileSync(requestsPath, headers)
    }

    // Append the new request
    fs.appendFileSync(requestsPath, csvRow + "\n")

    return { success: true }
  } catch (error) {
    console.error("Error submitting update request:", error)
    return { error: "An unexpected error occurred. Please try again later." }
  }
}

// Helper function to escape CSV fields
function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}
