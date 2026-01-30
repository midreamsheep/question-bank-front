/**
 * @file Mock problem repository.
 */
import type { ProblemRepository } from '../domain/ports/problemRepository'
import type {
  CreateProblemInput,
  PageResponse,
  ProblemCreateResponse,
  ProblemDetail,
  ProblemListQuery,
  PublishProblemInput,
  ProblemTag,
  ProblemStatusResponse,
  ProblemSummary,
  UpdateProblemInput,
} from '../domain/models'
import { mockStore } from '../../../infrastructure/mock/mockStore'
import { taxonomyStore } from '../../taxonomy/mock/mockTaxonomyStore'

function toSummary(problem: ProblemDetail): ProblemSummary {
  const tags = resolveTags(problem.tagIds)
  return {
    id: problem.id,
    title: problem.title,
    subject: problem.subject,
    difficulty: problem.difficulty,
    status: problem.status,
    visibility: problem.visibility,
    publishedAt: problem.publishedAt ?? null,
    author: problem.author ?? null,
    tagIds: problem.tagIds ?? [],
    tags,
  }
}

function resolveTags(tagIds?: number[] | null): ProblemTag[] {
  if (!tagIds?.length) return []
  const map = new Map(taxonomyStore.tags.map((t) => [t.id, t.name]))
  return tagIds
    .map((id) => ({ id, name: map.get(id) ?? '' }))
    .filter((t) => t.name.trim().length > 0)
}

function ensureTagIdsWithNewTags(subject: string, tagIds: number[], newTags?: string[]): number[] {
  const cleaned = (newTags ?? [])
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
  if (!cleaned.length) return tagIds

  const merged = new Set(tagIds)
  for (const name of cleaned) {
    const existing = taxonomyStore.tags.find(
      (t) => (t.subject ?? null) === subject && t.name.toLowerCase() === name.toLowerCase(),
    )
    if (existing) {
      merged.add(existing.id)
      continue
    }
    const createdId = taxonomyStore.nextTagId++
    taxonomyStore.tags.push({ id: createdId, name, subject })
    merged.add(createdId)
  }
  return Array.from(merged)
}

function ensureShareKey(problem: ProblemDetail): void {
  // Decision: shareKey is generated when UNLISTED, and kept even if visibility changes later.
  if (problem.visibility === 'UNLISTED' && !problem.shareKey) {
    problem.shareKey = `share-${problem.id}`
  }
}

export class MockProblemRepository implements ProblemRepository {
  async list(query: ProblemListQuery): Promise<PageResponse<ProblemSummary>> {
    const keyword = query.keyword?.toLowerCase()
    const subject = query.subject
    const authorId = query.authorId?.trim()
    const tagIds = query.tagIds?.filter((id) => typeof id === 'number' && Number.isFinite(id))
    let items = mockStore.problems
    if (subject) {
      items = items.filter((item) => item.subject === subject)
    }
    if (authorId) {
      items = items.filter((item) => String(item.author?.id ?? '') === authorId)
    }
    if (tagIds?.length) {
      items = items.filter((item) => {
        const ids = item.tagIds ?? []
        return tagIds.some((id) => ids.includes(id))
      })
    }
    if (keyword) {
      items = items.filter((item) => item.title.toLowerCase().includes(keyword))
    }
    items = items.filter(
      (item) => item.status === 'PUBLISHED' && item.visibility === 'PUBLIC',
    )
    const summaries = items.map(toSummary)
    return {
      items: summaries,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? summaries.length,
      total: summaries.length,
    }
  }

  async listMine(query: ProblemListQuery): Promise<PageResponse<ProblemSummary>> {
    const keyword = query.keyword?.toLowerCase().trim()
    const subject = query.subject
    const status = query.status
    const tagIds = query.tagIds?.filter((id) => typeof id === 'number' && Number.isFinite(id))
    const difficultyMin = query.difficultyMin
    const difficultyMax = query.difficultyMax

    let items = mockStore.problems
    if (subject) {
      items = items.filter((item) => item.subject === subject)
    }
    if (status) {
      items = items.filter((item) => item.status === status)
    }
    if (tagIds?.length) {
      items = items.filter((item) => {
        const ids = item.tagIds ?? []
        return tagIds.some((id) => ids.includes(id))
      })
    }
    if (typeof difficultyMin === 'number') {
      items = items.filter((item) => item.difficulty >= difficultyMin)
    }
    if (typeof difficultyMax === 'number') {
      items = items.filter((item) => item.difficulty <= difficultyMax)
    }
    if (keyword) {
      items = items.filter((item) => {
        const inTitle = item.title.toLowerCase().includes(keyword)
        const inStatement = item.statement.toLowerCase().includes(keyword)
        return inTitle || inStatement
      })
    }

    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const total = items.length
    const start = (page - 1) * pageSize
    const paged = items.slice(start, start + pageSize)
    const summaries = paged.map(toSummary)
    return { items: summaries, page, pageSize, total }
  }

  async getDetail(id: string): Promise<ProblemDetail> {
    const found = mockStore.problems.find((item) => item.id === id)
    if (!found) throw new Error('Problem not found')
    return { ...found, tagIds: found.tagIds ?? [], tags: resolveTags(found.tagIds) }
  }

  async getByShareKey(shareKey: string): Promise<ProblemDetail> {
    const found = mockStore.problems.find((item) => item.shareKey === shareKey)
    if (!found) throw new Error('Problem not found')
    return { ...found, tagIds: found.tagIds ?? [], tags: resolveTags(found.tagIds) }
  }

  async create(input: CreateProblemInput): Promise<ProblemCreateResponse> {
    const id = String(mockStore.nextProblemId++)
    const problem: ProblemDetail = {
      id,
      status: 'DRAFT',
      shareKey: null,
      publishedAt: null,
      author: {
        id: mockStore.user.id,
        nickname: mockStore.user.nickname || mockStore.user.username,
      },
      ...input,
    }
    problem.tagIds = input.tagIds ?? []
    problem.tags = resolveTags(problem.tagIds)
    ensureShareKey(problem)
    mockStore.problems.unshift(problem)
    const response: ProblemCreateResponse = {
      id,
      status: problem.status,
      visibility: problem.visibility,
      shareKey: problem.shareKey ?? null,
    }
    return response
  }

  async update(id: string, input: UpdateProblemInput): Promise<ProblemStatusResponse> {
    const index = mockStore.problems.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Problem not found')
    const current = mockStore.problems[index]
    if (!current) throw new Error('Problem not found')
    const updated: ProblemDetail = {
      ...current,
      ...input,
    }
    updated.tagIds = input.tagIds ?? updated.tagIds ?? []
    updated.tags = resolveTags(updated.tagIds)
    ensureShareKey(updated)
    mockStore.problems[index] = updated
    return {
      id: updated.id,
      status: updated.status,
      visibility: updated.visibility,
      shareKey: updated.shareKey ?? null,
    }
  }

  async publish(id: string, input?: PublishProblemInput): Promise<ProblemStatusResponse> {
    const index = mockStore.problems.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Problem not found')
    const current = mockStore.problems[index]
    if (!current) throw new Error('Problem not found')
    const nextSubjectRaw = String((input?.subject ?? current.subject) ?? '').trim()
    const nextSubject = nextSubjectRaw || current.subject
    const baseTagIds = input?.tagIds ?? current.tagIds ?? []
    const mergedTagIds = ensureTagIdsWithNewTags(nextSubject, baseTagIds, input?.newTags)
    const updated: ProblemDetail = {
      ...current,
      subject: nextSubject,
      tagIds: mergedTagIds,
      tags: resolveTags(mergedTagIds),
      status: 'PUBLISHED',
      publishedAt: current.publishedAt ?? new Date().toISOString(),
    }
    mockStore.problems[index] = updated
    return {
      id: updated.id,
      status: updated.status,
      visibility: updated.visibility,
      shareKey: updated.shareKey ?? null,
    }
  }

  async disable(id: string): Promise<ProblemStatusResponse> {
    const index = mockStore.problems.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Problem not found')
    const current = mockStore.problems[index]
    if (!current) throw new Error('Problem not found')
    const updated: ProblemDetail = { ...current, status: 'DISABLED' }
    updated.tagIds = updated.tagIds ?? []
    updated.tags = resolveTags(updated.tagIds)
    mockStore.problems[index] = updated
    return {
      id: updated.id,
      status: updated.status,
      visibility: updated.visibility,
      shareKey: updated.shareKey ?? null,
    }
  }

  async delete(id: string): Promise<void> {
    const index = mockStore.problems.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Problem not found')
    mockStore.problems.splice(index, 1)
  }
}
