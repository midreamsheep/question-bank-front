/**
 * @file Taxonomy domain models.
 */

// Backend migration (2026-01-29): subject is now a free string (trimmed, max 64 chars).
export type Subject = string

export type Category = {
  id: number
  name: string
  parentId?: number | null
  subject?: Subject | null
}

export type ProblemType = {
  id: number
  name: string
  subject?: Subject | null
}

export type Tag = {
  id: number
  name: string
  subject?: Subject | null
}

export type TaxonomyQuery = {
  subject?: Subject
  keyword?: string
}
