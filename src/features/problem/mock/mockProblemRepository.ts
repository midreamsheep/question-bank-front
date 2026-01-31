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
  ProblemTag,
  ProblemStatusResponse,
  ProblemSummary,
  UpdateProblemInput,
} from '../domain/models'
import { mockStore } from '../../../infrastructure/mock/mockStore'
import { taxonomyStore } from '../../taxonomy/mock/mockTaxonomyStore'

/**
 * Convert a detailed problem entity to a list summary.
 * @param problem problem detail
 * @returns problem summary
 */
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

/**
 * Resolve tag ids into tag objects using the mock taxonomy store.
 * @param tagIds tag ids
 * @returns tags
 */
function resolveTags(tagIds?: number[] | null): ProblemTag[] {
  if (!tagIds?.length) return []
  const map = new Map(taxonomyStore.tags.map((t) => [t.id, t.name]))
  return tagIds
    .map((id) => ({ id, name: map.get(id) ?? '' }))
    .filter((t) => t.name.trim().length > 0)
}

/**
 * Merge existing tag ids with newly provided tag names (create if missing).
 * @param subject subject scope
 * @param tagIds selected tag ids
 * @param newTags new tag names
 * @returns merged tag ids
 */
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

/**
 * Resolve tag names into tag ids (create if missing).
 * @param subject - Subject scope.
 * @param names - Tag names.
 * @returns Tag ids.
 */
function resolveTagIdsFromNames(subject: string, names: string[]): number[] {
  const cleaned = names
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
  if (!cleaned.length) return []
  return ensureTagIdsWithNewTags(subject, [], cleaned)
}

/**
 * Ensure a shareKey exists for unlisted problems (mock behavior).
 * @param problem problem detail (mutated)
 */
function ensureShareKey(problem: ProblemDetail): void {
  // Decision: shareKey is generated when UNLISTED, and kept even if visibility changes later.
  if (problem.visibility === 'UNLISTED' && !problem.shareKey) {
    problem.shareKey = `share-${problem.id}`
  }
}

export class MockProblemRepository implements ProblemRepository {
  /**
   * List public published problems (mock).
   * @param query list query
   * @returns paged summaries
   */
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

  /**
   * List problems owned by the current user (mock).
   * @param query list query
   * @returns paged summaries
   */
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

  /**
   * Get problem detail by id (mock).
   * @param id problem id
   * @returns problem detail
   */
  async getDetail(id: string): Promise<ProblemDetail> {
    const found = mockStore.problems.find((item) => item.id === id)
    if (!found) throw new Error('Problem not found')
    return { ...found, tagIds: found.tagIds ?? [], tags: resolveTags(found.tagIds) }
  }

  /**
   * Get problem detail by shareKey (mock).
   * @param shareKey share key
   * @returns problem detail
   */
  async getByShareKey(shareKey: string): Promise<ProblemDetail> {
    const found = mockStore.problems.find((item) => item.shareKey === shareKey)
    if (!found) throw new Error('Problem not found')
    return { ...found, tagIds: found.tagIds ?? [], tags: resolveTags(found.tagIds) }
  }

  /**
   * Create a draft problem (mock).
   * @param input create payload
   * @returns create response
   */
  async create(input: CreateProblemInput): Promise<ProblemCreateResponse> {
    const id = String(mockStore.nextProblemId++)
    const { tags: inputTags, ...rest } = input
    const problem: ProblemDetail = {
      id,
      status: 'DRAFT',
      shareKey: null,
      publishedAt: null,
      author: {
        id: mockStore.user.id,
        nickname: mockStore.user.nickname || mockStore.user.username,
      },
      ...rest,
    }
    problem.tagIds = Array.isArray(inputTags) ? resolveTagIdsFromNames(problem.subject, inputTags) : []
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

  /**
   * Update a problem (mock).
   * @param id problem id
   * @param input update payload
   * @returns status response
   */
  async update(id: string, input: UpdateProblemInput): Promise<ProblemStatusResponse> {
    const index = mockStore.problems.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Problem not found')
    const current = mockStore.problems[index]
    if (!current) throw new Error('Problem not found')
    const { tags: inputTags, ...rest } = input
    const updated: ProblemDetail = {
      ...current,
      ...rest,
    }
    if (Array.isArray(inputTags)) {
      updated.tagIds = resolveTagIdsFromNames(updated.subject, inputTags)
    } else if (inputTags === null) {
      // Null/absent tags means keep existing (mock mirrors backend semantics).
      updated.tagIds = updated.tagIds ?? []
    } else {
      updated.tagIds = updated.tagIds ?? []
    }
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

  /**
   * Publish a problem (mock).
   * @param id - Problem id.
   * @returns Status response.
   */
  async publish(id: string): Promise<ProblemStatusResponse> {
    const index = mockStore.problems.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Problem not found')
    const current = mockStore.problems[index]
    if (!current) throw new Error('Problem not found')
    const updated: ProblemDetail = {
      ...current,
      status: 'PUBLISHED',
      publishedAt: current.publishedAt ?? new Date().toISOString(),
    }
    updated.tagIds = updated.tagIds ?? []
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

  /**
   * Disable a problem (mock).
   * @param id problem id
   * @returns status response
   */
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

  /**
   * Delete a problem draft (mock).
   * @param id problem id
   */
  async delete(id: string): Promise<void> {
    const index = mockStore.problems.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Problem not found')
    mockStore.problems.splice(index, 1)
  }
}
