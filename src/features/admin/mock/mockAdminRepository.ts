/**
 * @file Mock admin repository.
 */
import type { AdminRepository } from '../domain/ports/adminRepository'
import type {
  Category,
  CreateCategoryInput,
  CreateProblemTypeInput,
  CreateTagInput,
  DailyProblemItem,
  ProblemType,
  PublishDailyProblemInput,
  Tag,
  UpdateCategoryInput,
  UpdateProblemTypeInput,
} from '../domain/models'
import { taxonomyStore } from '../../taxonomy/mock/mockTaxonomyStore'
import { mockStore } from '../../../infrastructure/mock/mockStore'

export class MockAdminRepository implements AdminRepository {
  async listCategories(): Promise<Category[]> {
    return taxonomyStore.categories
  }

  async listProblemTypes(): Promise<ProblemType[]> {
    return taxonomyStore.problemTypes
  }

  async listTags(): Promise<Tag[]> {
    return taxonomyStore.tags
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const category: Category = {
      id: taxonomyStore.nextCategoryId++,
      name: input.name,
      parentId: input.parentId ?? null,
      subject: input.subject ?? null,
    }
    taxonomyStore.categories.push(category)
    return category
  }

  async updateCategory(id: number, input: UpdateCategoryInput): Promise<Category> {
    const index = taxonomyStore.categories.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Category not found')
    const current = taxonomyStore.categories[index]
    if (!current) throw new Error('Category not found')
    const updated: Category = { ...current, ...input }
    taxonomyStore.categories[index] = updated
    return updated
  }

  async createProblemType(input: CreateProblemTypeInput): Promise<ProblemType> {
    const problemType: ProblemType = {
      id: taxonomyStore.nextProblemTypeId++,
      name: input.name,
      subject: input.subject ?? null,
    }
    taxonomyStore.problemTypes.push(problemType)
    return problemType
  }

  async updateProblemType(id: number, input: UpdateProblemTypeInput): Promise<ProblemType> {
    const index = taxonomyStore.problemTypes.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Problem type not found')
    const current = taxonomyStore.problemTypes[index]
    if (!current) throw new Error('Problem type not found')
    const updated: ProblemType = { ...current, ...input }
    taxonomyStore.problemTypes[index] = updated
    return updated
  }

  async createTag(input: CreateTagInput): Promise<Tag> {
    const tag: Tag = {
      id: taxonomyStore.nextTagId++,
      name: input.name,
      subject: input.subject ?? null,
    }
    taxonomyStore.tags.push(tag)
    return tag
  }

  async publishDailyProblem(input: PublishDailyProblemInput): Promise<DailyProblemItem> {
    const problem = mockStore.problems.find((item) => item.id === input.problemId)
    if (!problem) throw new Error('Problem not found')
    // Backend semantics: uniqueness is (day, problemId). Re-post updates/re-publishes.
    const existing = mockStore.dailyProblems.find(
      (item) => item.day === input.day && item.problem.id === input.problemId,
    )
    const summary: DailyProblemItem = {
      id: existing?.id ?? String(mockStore.nextDailyProblemItemId++),
      day: input.day,
      copywriting: input.copywriting ?? null,
      problem: {
        id: problem.id,
        title: problem.title,
        subject: problem.subject,
        difficulty: problem.difficulty,
      },
    }
    if (existing) {
      Object.assign(existing, summary)
    } else {
      mockStore.dailyProblems.push(summary)
    }
    return summary
  }

  async revokeDailyProblem(day: string): Promise<DailyProblemItem[]> {
    const removed: DailyProblemItem[] = []
    for (let i = mockStore.dailyProblems.length - 1; i >= 0; i -= 1) {
      const item = mockStore.dailyProblems[i]
      if (item && item.day === day) {
        removed.unshift(item)
        mockStore.dailyProblems.splice(i, 1)
      }
    }
    return removed
  }

  async revokeDailyProblemItem(id: string): Promise<DailyProblemItem> {
    const index = mockStore.dailyProblems.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Daily item not found')
    const current = mockStore.dailyProblems[index]
    if (!current) throw new Error('Daily item not found')
    mockStore.dailyProblems.splice(index, 1)
    return current
  }

  async disableProblem(id: string): Promise<void> {
    const index = mockStore.problems.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Problem not found')
    const current = mockStore.problems[index]
    if (!current) throw new Error('Problem not found')
    mockStore.problems[index] = { ...current, status: 'DISABLED' }
  }
}
