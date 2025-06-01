"use server"

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

    console.log("Validation passed, proceeding with email...")

    // Skip CSV backup in serverless environment - just send email
    const timestamp = new Date().toISOString()

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
      return { error: `Email delivery failed: ${error.message}` }
    }

    // Provide feedback about what happened
    let debugInfo = `Email delivery: ✅ Success\n`
    debugInfo += `Email ID: ${emailResult?.id || "No ID returned"}\n`
    debugInfo += `Sent to: calee607@gmail.com\n`
    debugInfo += `From: ${name} (${email})\n`

    console.log("Form submission completed successfully:", debugInfo)

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
      This email was automatically generated from the UX Glossary request form.<br>
      Reply to this email to respond directly to the submitter.
    </p>
  `

  // Send to your verified email address (calee607@gmail.com) with reply-to set to submitter
  const emailPayload = {
    from: "UX Glossary <onboarding@resend.dev>",
    to: "calee607@gmail.com", // Your verified email address
    reply_to: email, // Submitter's email for easy replies
    subject: subject,
    html: htmlContent,
  }

  console.log("Sending email via Resend API...")
  console.log("Sending to verified address:", emailPayload.to)

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
