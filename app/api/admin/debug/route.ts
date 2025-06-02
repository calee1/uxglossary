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
      suggestions: [],
    }

    // Validate repository format
    if (githubRepo) {
      const repoFormatValid = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(githubRepo)
      debugInfo.tests.repoFormat = {
        valid: repoFormatValid,
        expected: "username/repository-name",
        actual: githubRepo,
      }

      if (!repoFormatValid) {
        debugInfo.suggestions.push(`Repository format should be 'username/repository-name', got '${githubRepo}'`)
      }
    }

    // Test GitHub API connection
    if (githubToken && githubRepo) {
      try {
        console.log("Testing GitHub API connection...")

        // Test basic API access first
        const userResponse = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "User-Agent": "UX-Glossary-Admin",
            Accept: "application/vnd.github.v3+json",
          },
        })

        debugInfo.tests.userAccess = {
          status: userResponse.status,
          ok: userResponse.ok,
          statusText: userResponse.statusText,
        }

        if (userResponse.ok) {
          const userData = await userResponse.json()
          debugInfo.tests.userAccess.username = userData.login
          debugInfo.tests.userAccess.userType = userData.type
        } else {
          const errorText = await userResponse.text()
          debugInfo.tests.userAccess.error = errorText
          debugInfo.suggestions.push("GitHub token may be invalid or expired")
        }

        // Test repository access
        console.log("Testing repository access...")
        const testResponse = await fetch(`https://api.github.com/repos/${githubRepo}`, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "User-Agent": "UX-Glossary-Admin",
            Accept: "application/vnd.github.v3+json",
          },
        })

        debugInfo.tests.repoAccess = {
          status: testResponse.status,
          ok: testResponse.ok,
          statusText: testResponse.statusText,
          url: `https://api.github.com/repos/${githubRepo}`,
        }

        if (testResponse.ok) {
          const repoData = await testResponse.json()
          debugInfo.tests.repoAccess.repoName = repoData.name
          debugInfo.tests.repoAccess.defaultBranch = repoData.default_branch
          debugInfo.tests.repoAccess.private = repoData.private
          debugInfo.tests.repoAccess.permissions = repoData.permissions
        } else {
          const errorText = await testResponse.text()
          debugInfo.tests.repoAccess.error = errorText

          if (testResponse.status === 404) {
            debugInfo.suggestions.push(
              "Repository not found. Check that:",
              "1. Repository name is correct (username/repo-name)",
              "2. Repository exists and is accessible",
              "3. GitHub token has access to this repository",
            )
          } else if (testResponse.status === 403) {
            debugInfo.suggestions.push(
              "Access forbidden. Check that:",
              "1. GitHub token has the 'repo' scope",
              "2. Token has write access to the repository",
              "3. Repository is not archived or read-only",
            )
          }
        }

        // Test file access if repo access works
        if (testResponse.ok) {
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
            url: `https://api.github.com/repos/${githubRepo}/contents/data/glossary.csv?ref=${githubBranch}`,
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
        }
      } catch (apiError) {
        debugInfo.tests.apiError = {
          message: apiError instanceof Error ? apiError.message : "Unknown error",
          stack: apiError instanceof Error ? apiError.stack : undefined,
        }
      }
    } else {
      debugInfo.tests.configError = "Missing GitHub token or repo configuration"
      debugInfo.suggestions.push(
        "Set up GitHub integration:",
        "1. Create a GitHub Personal Access Token with 'repo' scope",
        "2. Set GITHUB_TOKEN environment variable",
        "3. Set GITHUB_REPO environment variable (format: username/repo-name)",
        "4. Optionally set GITHUB_BRANCH (defaults to 'main')",
      )
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
