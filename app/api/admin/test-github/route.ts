import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Check authentication
async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get("admin_auth")
    return authCookie?.value === "true"
  } catch (error) {
    console.error("Auth check error:", error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await isAuthenticated()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { githubToken, githubRepo, githubBranch = "main" } = await request.json()

    console.log("Testing GitHub connection...")
    console.log("- Repo:", githubRepo)
    console.log("- Branch:", githubBranch)
    console.log("- Token length:", githubToken?.length || 0)
    console.log("- Token prefix:", githubToken?.substring(0, 4) + "...")

    if (!githubToken || !githubRepo) {
      return NextResponse.json({
        success: false,
        error: "Missing GitHub token or repository",
        suggestions: ["Please provide both GitHub token and repository name"],
      })
    }

    // Validate token format
    if (!githubToken.startsWith("ghp_") && !githubToken.startsWith("github_pat_")) {
      return NextResponse.json({
        success: false,
        error: "Invalid GitHub token format",
        suggestions: [
          "GitHub Personal Access Tokens should start with 'ghp_' or 'github_pat_'",
          "Make sure you copied the entire token",
          "Create a new token if this one appears corrupted",
        ],
      })
    }

    // Validate repository format
    const repoFormatValid = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(githubRepo)
    if (!repoFormatValid) {
      return NextResponse.json({
        success: false,
        error: "Invalid repository format",
        suggestions: [
          "Repository should be in format: username/repository-name",
          "Example: johndoe/my-glossary-app",
          "Make sure there are no spaces or special characters",
        ],
      })
    }

    const results = {
      success: false,
      tests: {},
      suggestions: [],
      username: null,
    }

    // Test 1: Basic GitHub API access
    console.log("Step 1: Testing GitHub API access...")
    try {
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "User-Agent": "UX-Glossary-Admin",
          Accept: "application/vnd.github.v3+json",
        },
      })

      console.log("User API response status:", userResponse.status)

      if (userResponse.ok) {
        const userData = await userResponse.json()
        results.tests.userAccess = { success: true, username: userData.login }
        results.username = userData.login
        console.log("✓ GitHub API access successful, user:", userData.login)
      } else {
        const errorText = await userResponse.text()
        console.log("✗ GitHub API access failed:", userResponse.status, errorText)
        results.tests.userAccess = { success: false, error: errorText, status: userResponse.status }

        if (userResponse.status === 401) {
          results.suggestions.push("🔑 GitHub token is invalid or expired")
          results.suggestions.push("")
          results.suggestions.push("Common causes:")
          results.suggestions.push("• Token was copied incorrectly (missing characters)")
          results.suggestions.push("• Token has expired")
          results.suggestions.push("• Token was deleted or regenerated")
          results.suggestions.push("")
          results.suggestions.push("To fix this:")
          results.suggestions.push("1. Go to https://github.com/settings/tokens")
          results.suggestions.push("2. Check if your token still exists and hasn't expired")
          results.suggestions.push("3. If expired/missing, create a new token:")
          results.suggestions.push("   • Click 'Generate new token (classic)'")
          results.suggestions.push("   • Select 'repo' scope for full repository access")
          results.suggestions.push("   • Copy the ENTIRE token (starts with 'ghp_')")
          results.suggestions.push("4. Make sure to copy the token immediately - you can't see it again!")
        } else if (userResponse.status === 403) {
          results.suggestions.push("GitHub token permissions are insufficient")
          results.suggestions.push("Make sure your token has the 'repo' scope selected")
        }

        return NextResponse.json({
          success: false,
          error: `GitHub token authentication failed (${userResponse.status})`,
          suggestions: results.suggestions,
          details: results.tests,
        })
      }
    } catch (error) {
      console.log("✗ GitHub API request failed:", error)
      return NextResponse.json({
        success: false,
        error: "Failed to connect to GitHub API",
        suggestions: [
          "Check your internet connection",
          "Verify GitHub is accessible",
          "Make sure the token was copied correctly",
        ],
      })
    }

    // Test 2: Repository access
    console.log("Step 2: Testing repository access...")
    try {
      const repoResponse = await fetch(`https://api.github.com/repos/${githubRepo}`, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "User-Agent": "UX-Glossary-Admin",
          Accept: "application/vnd.github.v3+json",
        },
      })

      console.log("Repo API response status:", repoResponse.status)

      if (repoResponse.ok) {
        const repoData = await repoResponse.json()
        results.tests.repoAccess = {
          success: true,
          name: repoData.name,
          private: repoData.private,
          permissions: repoData.permissions,
        }
        console.log("✓ Repository access successful:", repoData.name)

        // Check if we have write permissions
        if (!repoData.permissions?.push) {
          results.suggestions.push("⚠️ Warning: Token may not have write access to this repository")
          results.suggestions.push("Make sure your token has 'repo' scope for full access")
        }
      } else {
        const errorText = await repoResponse.text()
        console.log("✗ Repository access failed:", repoResponse.status, errorText)
        results.tests.repoAccess = { success: false, error: errorText, status: repoResponse.status }

        if (repoResponse.status === 401) {
          results.suggestions.push("🔑 Token authentication failed for repository access")
          results.suggestions.push("This confirms the token is invalid - please create a new one")
        } else if (repoResponse.status === 404) {
          results.suggestions.push(`Repository '${githubRepo}' not found`)
          results.suggestions.push("Check that the repository name is correct (username/repo-name)")
          results.suggestions.push("Make sure the repository exists and is accessible")
          results.suggestions.push("For private repos, ensure your token has access")
        } else if (repoResponse.status === 403) {
          results.suggestions.push("🔑 Access forbidden - This is a permissions issue!")
          results.suggestions.push("Your GitHub token doesn't have the right permissions")
          results.suggestions.push("Make sure your token has 'repo' scope selected")
        }

        return NextResponse.json({
          success: false,
          error: `Repository access failed (${repoResponse.status})`,
          suggestions: results.suggestions,
          details: results.tests,
        })
      }
    } catch (error) {
      console.log("✗ Repository request failed:", error)
      return NextResponse.json({
        success: false,
        error: "Failed to check repository access",
        suggestions: ["Check that the repository name is correct", "Verify the repository exists"],
      })
    }

    // Test 3: Write access test (try to get file info)
    console.log("Step 3: Testing write access...")
    try {
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

      if (fileResponse.ok) {
        const fileData = await fileResponse.json()
        results.tests.fileAccess = { success: true, exists: true, sha: fileData.sha }
        console.log("✓ File access successful, file exists")
      } else if (fileResponse.status === 404) {
        results.tests.fileAccess = { success: true, exists: false }
        console.log("✓ File access successful, file doesn't exist yet (normal)")
      } else {
        console.log("File access test failed:", fileResponse.status)
        results.tests.fileAccess = { success: false, status: fileResponse.status }
      }
    } catch (error) {
      console.log("File access test failed (non-critical):", error)
    }

    // If we get here, all critical tests passed
    results.success = true

    console.log("✓ All tests passed successfully!")

    return NextResponse.json({
      success: true,
      message: "GitHub integration configured successfully",
      username: results.username,
      repository: githubRepo,
      branch: githubBranch,
      tests: results.tests,
    })
  } catch (error) {
    console.error("Test GitHub endpoint error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
