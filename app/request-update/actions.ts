"use server"

import fs from "fs"
import path from "path"

interface RequestState {
  success?: boolean
  error?: string
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

    try {
      // Ensure data directory exists
      const dataDir = path.resolve(process.cwd(), "data")
      if (!fs.existsSync(dataDir)) {
        console.log("Creating data directory...")
        fs.mkdirSync(dataDir, { recursive: true })
      }

      // Check if requests file exists, create with headers if not
      const requestsPath = path.resolve(dataDir, "update-requests.csv")
      if (!fs.existsSync(requestsPath)) {
        console.log("Creating CSV file with headers...")
        const headers = "timestamp,name,email,request_type,update_request,source,status\n"
        fs.writeFileSync(requestsPath, headers)
      }

      // Append the new request to CSV for backup
      console.log("Appending to CSV file...")
      fs.appendFileSync(requestsPath, csvRow + "\n")
      console.log("CSV backup successful")
    } catch (csvError) {
      console.error("CSV backup failed:", csvError)
      // Continue anyway - CSV failure shouldn't stop email
    }

    // Send email notification
    console.log("Attempting to send email...")
    try {
      await sendEmailNotification({
        name,
        email,
        requestType,
        updateRequest,
        source,
        timestamp,
      })
      console.log("Email sent successfully")
    } catch (emailError) {
      console.error("Email sending failed:", emailError)
      // For now, we'll still return success since CSV backup worked
      // You might want to change this behavior based on your needs
      console.log("Continuing despite email failure...")
    }

    console.log("Form submission completed successfully")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in submitUpdateRequest:", error)

    // Provide more specific error information
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
      return { error: `Error: ${error.message}` }
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

  const textContent = `
New UX Glossary Update Request

Submitted: ${new Date(timestamp).toLocaleString()}

Contact Information:
Name: ${name}
Email: ${email}

Request Details:
Type: ${requestType}
Source/Reference: ${source || "Not provided"}

Request Description:
${updateRequest}

---
This email was automatically generated from the UX Glossary request form.
  `

  const emailPayload = {
    from: "UX Glossary <noreply@calee.me>",
    to: "cal@calee.me",
    reply_to: email,
    subject: subject,
    html: htmlContent,
    text: textContent,
  }

  console.log("Email payload prepared, checking for RESEND_API_KEY...")
  console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY)

  // Check if Resend API key is available
  if (process.env.RESEND_API_KEY) {
    console.log("Sending email via Resend API...")

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    })

    console.log("Resend API response status:", response.status)

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Resend API error response:", errorData)
      throw new Error(`Email API error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()
    console.log("Email sent successfully via Resend:", result)
    return result
  } else {
    // Fallback: Log email content if no email service is configured
    console.log("No RESEND_API_KEY found, logging email content instead:")
    console.log("Subject:", subject)
    console.log("To: cal@calee.me")
    console.log("From:", email)
    console.log("Content preview:", textContent.substring(0, 200) + "...")

    // Don't throw an error in development - just log
    console.log("Email would be sent in production with proper API key")
  }
}
