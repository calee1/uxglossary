import { type NextRequest, NextResponse } from "next/server"
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

export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { githubToken, githubRepo, githubBranch = "main" } = await request.json()

    console.log("Testing GitHub connection...")
    console.log("- Repo:", githubRepo)
    console.log("- Branch:", githubBranch)
    console.log("- Token length:", githubToken?.length || 0)

    if (!githubToken || !githubRepo) {
      return NextResponse.json({
        success: false,
        error: "Missing GitHub token or repository",
        suggestions: ["Please provide both GitHub token and repository name"],
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

      if (userResponse.ok) {
        const userData = await userResponse.json()
        results.tests.userAccess = { success: true, username: userData.login }
        results.username = userData.login
        console.log("✓ GitHub API access successful, user:", userData.login)
      } else {
        const errorText = await userResponse.text()
        console.log("✗ GitHub API access failed:", userResponse.status, errorText)
        results.tests.userAccess = { success: false, error: errorText }

        if (userResponse.status === 401) {
          results.suggestions.push("GitHub token is invalid or expired")
          results.suggestions.push("Create a new token at: https://github.com/settings/tokens/new")
          results.suggestions.push(
            "Make sure the token has 'repo' scope for private repos or 'public_repo' for public repos",
          )
        } else if (userResponse.status === 403) {
          results.suggestions.push("GitHub token permissions are insufficient")
          results.suggestions.push("Check that your token has the correct scopes:")
          results.suggestions.push("- 'repo' scope for private repositories")
          results.suggestions.push("- 'public_repo' scope for public repositories")
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
        suggestions: ["Check your internet connection", "Verify GitHub is accessible"],
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
        results.tests.repoAccess = { success: false, error: errorText }

        if (repoResponse.status === 404) {
          results.suggestions.push(`Repository '${githubRepo}' not found`)
          results.suggestions.push("Check that the repository name is correct (username/repo-name)")
          results.suggestions.push("Make sure the repository exists and is accessible")
          results.suggestions.push("For private repos, ensure your token has access")
        } else if (repoResponse.status === 403) {
          results.suggestions.push("🔑 Access forbidden - This is a permissions issue!")
          results.suggestions.push("Your GitHub token doesn't have the right permissions")
          results.suggestions.push("")
          results.suggestions.push("To fix this:")
          results.suggestions.push("1. Go to https://github.com/settings/tokens")
          results.suggestions.push("2. Find your token or create a new one")
          results.suggestions.push("3. Make sure these scopes are selected:")
          results.suggestions.push("   ✅ 'repo' (Full control of private repositories)")
          results.suggestions.push("   ✅ 'public_repo' (Access public repositories)")
          results.suggestions.push("4. If editing an existing token, you may need to regenerate it")
          results.suggestions.push("")
          results.suggestions.push("Alternative: Create a new token with the correct permissions")
        }

        return NextResponse.json({
          success: false,
          error: `GitHub API error: ${repoResponse.status}`,
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

    // Test 3: Branch access (optional)
    console.log("Step 3: Testing branch access...")
    try {
      const branchResponse = await fetch(`https://api.github.com/repos/${githubRepo}/branches/${githubBranch}`, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "User-Agent": "UX-Glossary-Admin",
          Accept: "application/vnd.github.v3+json",
        },
      })

      if (branchResponse.ok) {
        results.tests.branchAccess = { success: true }
        console.log("✓ Branch access successful:", githubBranch)
      } else if (branchResponse.status === 404) {
        results.tests.branchAccess = { success: false, error: "Branch not found" }
        results.suggestions.push(`Branch '${githubBranch}' not found, will use default branch`)
      }
    } catch (error) {
      console.log("Branch check failed (non-critical):", error)
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
