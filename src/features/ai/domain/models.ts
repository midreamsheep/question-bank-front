/**
 * @file AI feature domain models.
 */

export type AiProblemAnalysisStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'

export type AiProblemAnalysisHighlights = {
  methodHints?: string[]
  keyObservations?: string[]
  pitfalls?: string[]
}

export type AiProblemAnalysis = {
  requestId: string
  problemId: number
  status: AiProblemAnalysisStatus
  promptVersion: string
  model: string | null
  analysisMarkdown: string | null
  stepByStep: string[]
  highlights?: AiProblemAnalysisHighlights
  errorMessage: string | null
  updatedAt: string
}

export type AiDifficultyRange = {
  min: number
  max: number
}

export type AiSubjectNormalization = {
  original: string
  normalized: string
  operations?: string[]
}

export type AiSubjectRecommendation = {
  value: string
  source?: string
  inferredFromContent?: boolean
  bestMatch?: string | null
  alternatives?: string[]
  reasons?: string[]
}

export type AiDifficultyRecommendation = {
  value: number
  reasons?: string[]
}

export type AiTagRecommendations = {
  add?: string[]
  remove?: string[]
  keep?: string[]
}

export type AiProblemMetadataRecommendationsRequest = {
  title: string
  subjectInput: string
  statementFormat: 'MARKDOWN' | 'LATEX'
  statement: string
  solutionFormat: 'MARKDOWN' | 'LATEX' | null
  solution: string | null
  existingTags: string[]
  difficultyRange: AiDifficultyRange
  maxTitleSuggestions?: number
  maxTagAddCount?: number
}

export type AiProblemMetadataRecommendations = {
  requestId: string
  promptVersion: string
  model: string | null
  titleSuggestions?: string[]
  subjectNormalization?: AiSubjectNormalization
  subjectRecommendation?: AiSubjectRecommendation
  difficultyRecommendation?: AiDifficultyRecommendation
  tagRecommendations?: AiTagRecommendations
  keywords?: string[]
}
