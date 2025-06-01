"use server"

import fs from "fs"
import path from "path"

interface RequestState {
  success?: boolean
  error?: string
  debug?: string
}

export async function submitUpdateRequest(prevState: RequestState | null, formData: FormData): Promise<RequestState> {
  try {
    console.log("Starting form submission...")

    // Extract form data
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const requestType = formData.get("requestType") as string
    const updateRequest = formData.get("updateRequest") as string
    const source = formData.get("source") as string

    console.log("Form data extracted:", { name, email, requestType, hasUpdateRequest: !!updateRequest })

    // Validate required fields
    if (!name || !email || !requestType || !updateRequest) {
      console.log("Validation failed - missing required fields")
      return { error: "Please fill in all required fields." }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("Validation failed - invalid email format")
      return { error: "Please enter a valid email address." }
    }

    console.log("Validation passed, proceeding with CSV backup...")

    // Prepare CSV data for backup
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

    let csvSuccess = false
    let csvError = null
    try {
      // Try to save to CSV - this might fail in some hosting environments
      const dataDir = path.resolve(process.cwd(), "data")

      // Check if we can write to the filesystem
      if (!fs.existsSync(dataDir)) {
        console.log("Creating data directory...")
        fs.mkdirSync(dataDir, { recursive: true })
      }

      const requestsPath = path.resolve(dataDir, "update-requests.csv")
      if (!fs.existsSync(requestsPath)) {
        console.log("Creating CSV file with headers...")
        const headers = "timestamp,name,email,request_type,update_request,source,status\n"
        fs.writeFileSync(requestsPath, headers)
      }

      console.log("Appending to CSV file...")
      fs.appendFileSync(requestsPath, csvRow + "\n")
      console.log("CSV backup successful")
      csvSuccess = true
    } catch (error) {
      csvError = error
      console.error("CSV backup failed:", error)
      // Don't fail the entire process if CSV fails - continue with email
    }

    // Send email notification
    console.log("Attempting to send email...")
    let emailResult = null
    let emailError = null

    try {
      emailResult = await sendEmailNotification({
        name,
        email,
        requestType,
        updateRequest,
        source,
        timestamp,
      })
      console.log("Email function completed successfully:", emailResult)
    } catch (error) {
      emailError = error
      console.error("Email sending failed:", error)
    }

    // Check if at least one method succeeded
    if (!csvSuccess && emailError) {
      return {
        error: `Both backup methods failed. CSV: ${csvError?.message || "Unknown error"}. Email: ${emailError.message}`,
      }
    }

    // Provide detailed feedback about what happened
    let debugInfo = `CSV backup: ${csvSuccess ? "✅ Success" : "❌ Failed - " + (csvError?.message || "Unknown error")}\n`
    debugInfo += `Email delivery: ${emailError ? "❌ Failed - " + emailError.message : "✅ Success"}\n`
    debugInfo += `API Key format: ${process.env.RESEND_API_KEY ? `Present (${process.env.RESEND_API_KEY.substring(0, 8)}...)` : "Missing"}\n`

    if (emailResult?.id) {
      debugInfo += `Email ID: ${emailResult.id}\n`
    }

    console.log("Form submission completed with debug info:", debugInfo)

    return {
      success: true,
      debug: debugInfo,
    }
  } catch (error) {
    console.error("Unexpected error in submitUpdateRequest:", error)

    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
      return { error: `Unexpected error: ${error.message}` }
    }

    return { error: "An unexpected error occurred. Please try again later." }
  }
}

// Helper function to escape CSV fields
function escapeCSVField(field: string): string {
  if (!field) return ""
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

// Email sending function
async function sendEmailNotification({
  name,
  email,
  requestType,
  updateRequest,
  source,
  timestamp,
}: {
  name: string
  email: string
  requestType: string
  updateRequest: string
  source: string
  timestamp: string
}) {
  console.log("Preparing email content...")

  // Check API key first
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set")
  }

  if (!process.env.RESEND_API_KEY.startsWith("re_")) {
    throw new Error("RESEND_API_KEY appears to be invalid (should start with 're_')")
  }

  // Format the email content
  const subject = `UX Glossary Update Request - ${requestType}`
  const htmlContent = `
    <h2>New UX Glossary Update Request</h2>
    <p><strong>Submitted:</strong> ${new Date(timestamp).toLocaleString()}</p>
    
    <h3>Contact Information</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    
    <h3>Request Details</h3>
    <p><strong>Type:</strong> ${requestType}</p>
    <p><strong>Source/Reference:</strong> ${source || "Not provided"}</p>
    
    <h3>Request Description</h3>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
      ${updateRequest.replace(/\n/g, "<br>")}
    </div>
    
    <hr>
    <p style="color: #666; font-size: 12px;">
      This email was automatically generated from the UX Glossary request form.
    </p>
  `

  // Use a more generic from address that's likely to work
  const emailPayload = {
    from: "UX Glossary <onboarding@resend.dev>", // Using Resend's default domain
    to: "cal@calee.me",
    reply_to: email,
    subject: subject,
    html: htmlContent,
  }

  console.log("Sending email via Resend API...")
  console.log("Using from address:", emailPayload.from)

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailPayload),
  })

  console.log("Resend API response status:", response.status)

  const responseText = await response.text()
  console.log("Raw response:", responseText)

  if (!response.ok) {
    console.error("Resend API error response:", responseText)
    throw new Error(`Email API error: ${response.status} - ${responseText}`)
  }

  let result
  try {
    result = JSON.parse(responseText)
    console.log("Parsed email response:", result)
  } catch (parseError) {
    console.error("Failed to parse response as JSON:", parseError)
    throw new Error("Invalid response from email service")
  }

  return result
}
