export interface GlossaryItem {
  term: string
  definition: string
  category?: string
  seeAlso?: string
}

export interface GlossaryData {
  [letter: string]: GlossaryItem[]
}

export interface GlossaryStats {
  totalTerms: number
  totalLetters: number
  lastUpdated: string
  categories: number
}
