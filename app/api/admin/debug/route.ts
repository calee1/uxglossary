import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Check authentication
function isAuthenticated(): boolean {
  try {
    const cookieStore = cookies()
    const authCookie = cookieStore.get("admin_auth")
    return authCookie?.value === "true"
  } catch (error) {
    console.error("Auth check error:", error)
    return false
  }
}

export async function GET() {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const githubToken = process.env.GITHUB_TOKEN
    const githubRepo = process.env.GITHUB_REPO
    const githubBranch = process.env.GITHUB_BRANCH || "main"

    console.log("Debug endpoint called")
    console.log("Environment variables check:")
    console.log("- GITHUB_TOKEN exists:", !!githubToken)
    console.log("- GITHUB_TOKEN length:", githubToken?.length || 0)
    console.log("- GITHUB_TOKEN prefix:", githubToken?.substring(0, 10) + "...")
    console.log("- GITHUB_REPO:", githubRepo)
    console.log("- GITHUB_BRANCH:", githubBranch)

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        hasGithubToken: !!githubToken,
        tokenLength: githubToken?.length || 0,
        tokenPrefix: githubToken?.substring(0, 10) + "...",
        githubRepo,
        githubBranch,
        nodeEnv: process.env.NODE_ENV,
      },
      tests: {},
    }

    // Test GitHub API connection
    if (githubToken && githubRepo) {
      try {
        console.log("Testing GitHub API connection...")

        // Test basic API access
        const testResponse = await fetch(`https://api.github.com/repos/${githubRepo}`, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "User-Agent": "UX-Glossary-Admin",
            Accept: "application/vnd.github.v3+json",
          },
        })

        debugInfo.tests = {
          ...debugInfo.tests,
          repoAccess: {
            status: testResponse.status,
            ok: testResponse.ok,
            statusText: testResponse.statusText,
          },
        }

        if (testResponse.ok) {
          const repoData = await testResponse.json()
          debugInfo.tests.repoAccess.repoName = repoData.name
          debugInfo.tests.repoAccess.defaultBranch = repoData.default_branch
        } else {
          const errorText = await testResponse.text()
          debugInfo.tests.repoAccess.error = errorText
        }

        // Test file access
        console.log("Testing file access...")
        const fileResponse = await fetch(
          `https://api.github.com/repos/${githubRepo}/contents/data/glossary.csv?ref=${githubBranch}`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              "User-Agent": "UX-Glossary-Admin",
              Accept: "application/vnd.github.v3+json",
            },
          },
        )

        debugInfo.tests.fileAccess = {
          status: fileResponse.status,
          ok: fileResponse.ok,
          statusText: fileResponse.statusText,
        }

        if (fileResponse.ok) {
          const fileData = await fileResponse.json()
          debugInfo.tests.fileAccess.fileExists = true
          debugInfo.tests.fileAccess.fileSha = fileData.sha
          debugInfo.tests.fileAccess.fileSize = fileData.size
        } else if (fileResponse.status === 404) {
          debugInfo.tests.fileAccess.fileExists = false
          debugInfo.tests.fileAccess.note = "File doesn't exist yet - this is normal for first setup"
        } else {
          const errorText = await fileResponse.text()
          debugInfo.tests.fileAccess.error = errorText
        }
      } catch (apiError) {
        debugInfo.tests.apiError = {
          message: apiError instanceof Error ? apiError.message : "Unknown error",
          stack: apiError instanceof Error ? apiError.stack : undefined,
        }
      }
    } else {
      debugInfo.tests.configError = "Missing GitHub token or repo configuration"
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
