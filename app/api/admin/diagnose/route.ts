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

    console.log("=== DIAGNOSTIC REPORT ===")
    console.log("Environment Variables:")
    console.log("- GITHUB_TOKEN exists:", !!githubToken)
    console.log("- GITHUB_TOKEN length:", githubToken?.length || 0)
    console.log("- GITHUB_TOKEN starts with ghp_:", githubToken?.startsWith("ghp_") || false)
    console.log("- GITHUB_TOKEN starts with github_pat_:", githubToken?.startsWith("github_pat_") || false)
    console.log("- GITHUB_REPO:", githubRepo)
    console.log("- GITHUB_BRANCH:", githubBranch)

    const diagnosis = {
      timestamp: new Date().toISOString(),
      environment: {
        hasToken: !!githubToken,
        tokenLength: githubToken?.length || 0,
        tokenFormat: githubToken?.startsWith("ghp_") || githubToken?.startsWith("github_pat_") ? "valid" : "invalid",
        tokenPrefix: githubToken?.substring(0, 10) + "...",
        repo: githubRepo,
        branch: githubBranch,
        nodeEnv: process.env.NODE_ENV,
      },
      tests: {},
      issues: [],
      recommendations: [],
    }

    // Check token format
    if (!githubToken) {
      diagnosis.issues.push("❌ GITHUB_TOKEN environment variable is missing")
      diagnosis.recommendations.push("Set GITHUB_TOKEN in Vercel environment variables")
    } else if (!githubToken.startsWith("ghp_") && !githubToken.startsWith("github_pat_")) {
      diagnosis.issues.push("❌ GITHUB_TOKEN has invalid format")
      diagnosis.recommendations.push("Token should start with 'ghp_' or 'github_pat_'")
    } else if (githubToken.length < 30) {
      diagnosis.issues.push("❌ GITHUB_TOKEN appears too short")
      diagnosis.recommendations.push("GitHub tokens are typically 40+ characters long")
    }

    // Check repo format
    if (!githubRepo) {
      diagnosis.issues.push("❌ GITHUB_REPO environment variable is missing")
      diagnosis.recommendations.push("Set GITHUB_REPO in format: username/repository-name")
    } else if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(githubRepo)) {
      diagnosis.issues.push("❌ GITHUB_REPO has invalid format")
      diagnosis.recommendations.push("Repository should be in format: username/repository-name")
    }

    // Test GitHub API if we have credentials
    if (githubToken && githubRepo) {
      console.log("Testing GitHub API...")

      try {
        // Test 1: Basic user access
        const userResponse = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "User-Agent": "UX-Glossary-Diagnostic",
            Accept: "application/vnd.github.v3+json",
          },
        })

        diagnosis.tests.userAccess = {
          status: userResponse.status,
          ok: userResponse.ok,
        }

        if (userResponse.ok) {
          const userData = await userResponse.json()
          diagnosis.tests.userAccess.username = userData.login
          diagnosis.tests.userAccess.type = userData.type
          console.log("✅ User access successful:", userData.login)
        } else {
          const errorText = await userResponse.text()
          diagnosis.tests.userAccess.error = errorText
          console.log("❌ User access failed:", userResponse.status)

          if (userResponse.status === 401) {
            diagnosis.issues.push("❌ GitHub token is invalid or expired")
            diagnosis.recommendations.push("Create a new GitHub Personal Access Token")
            diagnosis.recommendations.push("Make sure the token has 'repo' scope")
          }
        }

        // Test 2: Repository access (only if user access works)
        if (userResponse.ok) {
          const repoResponse = await fetch(`https://api.github.com/repos/${githubRepo}`, {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              "User-Agent": "UX-Glossary-Diagnostic",
              Accept: "application/vnd.github.v3+json",
            },
          })

          diagnosis.tests.repoAccess = {
            status: repoResponse.status,
            ok: repoResponse.ok,
          }

          if (repoResponse.ok) {
            const repoData = await repoResponse.json()
            diagnosis.tests.repoAccess.name = repoData.name
            diagnosis.tests.repoAccess.private = repoData.private
            diagnosis.tests.repoAccess.permissions = repoData.permissions
            console.log("✅ Repository access successful:", repoData.name)

            if (!repoData.permissions?.push) {
              diagnosis.issues.push("⚠️ Token may not have write access to repository")
              diagnosis.recommendations.push("Ensure token has 'repo' scope for write access")
            }
          } else {
            const errorText = await repoResponse.text()
            diagnosis.tests.repoAccess.error = errorText
            console.log("❌ Repository access failed:", repoResponse.status)

            if (repoResponse.status === 404) {
              diagnosis.issues.push("❌ Repository not found or not accessible")
              diagnosis.recommendations.push("Check repository name is correct")
              diagnosis.recommendations.push("Ensure repository exists and token has access")
            } else if (repoResponse.status === 403) {
              diagnosis.issues.push("❌ Access forbidden to repository")
              diagnosis.recommendations.push("Token needs 'repo' scope for private repositories")
            }
          }
        }
      } catch (apiError) {
        diagnosis.tests.apiError = {
          message: apiError instanceof Error ? apiError.message : "Unknown error",
        }
        diagnosis.issues.push("❌ Failed to connect to GitHub API")
        diagnosis.recommendations.push("Check internet connection and GitHub status")
      }
    }

    // Generate summary
    if (diagnosis.issues.length === 0) {
      diagnosis.summary = "✅ All checks passed - GitHub integration should work"
    } else {
      diagnosis.summary = `❌ Found ${diagnosis.issues.length} issue(s) that need to be fixed`
    }

    console.log("=== DIAGNOSIS COMPLETE ===")
    console.log("Summary:", diagnosis.summary)
    console.log("Issues:", diagnosis.issues)

    return NextResponse.json(diagnosis)
  } catch (error) {
    console.error("Diagnostic error:", error)
    return NextResponse.json(
      {
        error: "Diagnostic failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
