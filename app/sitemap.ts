import type { MetadataRoute } from "next"
import fs from "fs"
import path from "path"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://uxglossary.vercel.app"

  // Base routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/request-update`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ] as MetadataRoute.Sitemap

  // Add letter pages
  const letters = [
    "0-9",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
  ]

  for (const letter of letters) {
    routes.push({
      url: `${baseUrl}/letter/${letter}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    })
  }

  // Try to get glossary terms for individual term pages if needed in the future
  try {
    const csvPath = path.resolve(process.cwd(), "data", "glossary.csv")
    if (fs.existsSync(csvPath)) {
      const { parseCSV } = await import("@/lib/glossary-data")
      const csvContent = fs.readFileSync(csvPath, "utf-8")
      const items = parseCSV(csvContent)

      // Could add individual term pages here if needed
      // For now, we'll just use the letter pages
    }
  } catch (error) {
    console.error("Error generating sitemap:", error)
  }

  return routes
}
