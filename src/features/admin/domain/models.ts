/**
 * @file Admin domain models.
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

export type CreateCategoryInput = {
  name: string
  parentId?: number | null
  subject?: Subject | null
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>

export type CreateProblemTypeInput = {
  name: string
  subject?: Subject | null
}

export type UpdateProblemTypeInput = Partial<CreateProblemTypeInput>

export type CreateTagInput = {
  name: string
  subject?: Subject | null
}

export type PublishDailyProblemInput = {
  day: string
  problemId: string
  copywriting?: string | null
}

export type DailyProblemItem = {
  id: string
  day: string
  copywriting?: string | null
  problem: {
    id: string
    title: string
    subject: Subject
    difficulty: number
  }
}
