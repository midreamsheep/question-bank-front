/**
 * @file Mock collection repository.
 */
import type { CollectionRepository } from '../domain/ports/collectionRepository'
import type {
  AddCollectionItemInput,
  CollectionCreateResponse,
  CollectionDetail,
  CollectionListQuery,
  CollectionSummary,
  CreateCollectionInput,
  PageResponse,
  ReorderCollectionInput,
} from '../domain/models'
import { mockStore } from '../../../infrastructure/mock/mockStore'

/**
 * Convert a collection detail into a list summary shape.
 * @param detail - Collection detail.
 * @returns Collection summary.
 */
function toSummary(detail: CollectionDetail): CollectionSummary {
  return {
    id: detail.id,
    name: detail.name,
    description: detail.description,
    visibility: detail.visibility,
    status: detail.status,
    itemCount: detail.items?.length ?? 0,
    authorId: mockStore.user.id,
  }
}

/**
 * Ensure a shareKey exists when the collection becomes UNLISTED.
 * @param detail - Collection detail.
 * @param record - Record holding the persisted shareKey.
 * @param record.shareKey - Persisted share key.
 */
function ensureShareKey(detail: CollectionDetail, record: { shareKey: string | null }): void {
  // Decision: shareKey is generated when UNLISTED, and kept even if visibility changes later.
  if (detail.visibility === 'UNLISTED' && !record.shareKey) {
    record.shareKey = `collection-${detail.id}-share`
  }
}

export class MockCollectionRepository implements CollectionRepository {
  /**
   * List public collections for browsing.
   * @param query - Paging and filter query.
   * @returns Page result of collection summaries.
   */
  async list(query: CollectionListQuery): Promise<PageResponse<CollectionSummary>> {
    const authorId = query.authorId?.trim()
    const items = mockStore.collections
      .filter((record) => record.detail.visibility === 'PUBLIC' && record.detail.status === 'ACTIVE')
      .map((record) => toSummary(record.detail))
      .filter((item) => (authorId ? item.authorId === authorId : true))
    return {
      items,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? items.length,
      total: items.length,
    }
  }

  /**
   * List collections owned by the current mocked user.
   * @param query - Paging and filter query.
   * @returns Page result of collection summaries.
   */
  async listMine(query: CollectionListQuery): Promise<PageResponse<CollectionSummary>> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    let all = mockStore.collections
    if (query.status) {
      all = all.filter((record) => record.detail.status === query.status)
    }
    const total = all.length
    const start = (page - 1) * pageSize
    const paged = all.slice(start, start + pageSize)
    const items = paged.map((record) => toSummary(record.detail))
    return { items, page, pageSize, total }
  }

  /**
   * Get full detail for a collection by id.
   * @param id - Collection id.
   * @returns Collection detail.
   */
  async getDetail(id: string): Promise<CollectionDetail> {
    const found = mockStore.collections.find((record) => record.detail.id === id)
    if (!found) throw new Error('Collection not found')
    return {
      ...found.detail,
      shareKey: found.shareKey,
      items: found.detail.items ? [...found.detail.items] : [],
    }
  }

  /**
   * Get full detail for a collection by shareKey (public share entry).
   * @param shareKey - Collection share key.
   * @returns Collection detail.
   */
  async getByShareKey(shareKey: string): Promise<CollectionDetail> {
    const found = mockStore.collections.find((record) => record.shareKey === shareKey)
    if (!found) throw new Error('Collection not found')
    return {
      ...found.detail,
      shareKey: found.shareKey,
      items: found.detail.items ? [...found.detail.items] : [],
    }
  }

  /**
   * Create a new collection owned by the mocked user.
   * @param input - Create input.
   * @returns Create response including shareKey (if applicable).
   */
  async create(input: CreateCollectionInput): Promise<CollectionCreateResponse> {
    const detail: CollectionDetail = {
      id: String(mockStore.nextCollectionId++),
      name: input.name,
      description: input.description,
      visibility: input.visibility,
      status: 'ACTIVE',
      items: [],
    }
    const record = { detail, shareKey: null }
    ensureShareKey(detail, record)
    mockStore.collections.unshift(record)
    return {
      id: detail.id,
      status: detail.status,
      visibility: detail.visibility,
      shareKey: record.shareKey,
    }
  }

  /**
   * Update an existing collection.
   * @param id - Collection id.
   * @param input - Update input.
   * @returns Updated collection detail.
   */
  async update(id: string, input: CreateCollectionInput): Promise<CollectionDetail> {
    const index = mockStore.collections.findIndex((record) => record.detail.id === id)
    if (index < 0) throw new Error('Collection not found')
    const current = mockStore.collections[index]
    if (!current) throw new Error('Collection not found')
    const next: CollectionDetail = {
      ...current.detail,
      ...input,
    }
    current.detail = next
    ensureShareKey(next, current)
    mockStore.collections[index] = current
    return { ...next, shareKey: current.shareKey, items: next.items ? [...next.items] : [] }
  }

  /**
   * Delete a collection by id.
   * @param id - Collection id.
   */
  async delete(id: string): Promise<void> {
    const index = mockStore.collections.findIndex((record) => record.detail.id === id)
    if (index < 0) throw new Error('Collection not found')
    mockStore.collections.splice(index, 1)
  }

  /**
   * Add a problem item into a collection.
   * @param id - Collection id.
   * @param input - Item input.
   */
  async addItem(id: string, input: AddCollectionItemInput): Promise<void> {
    const found = mockStore.collections.find((record) => record.detail.id === id)
    if (!found) throw new Error('Collection not found')
    const items = found.detail.items ?? []
    const problem = mockStore.problems.find((item) => item.id === input.problemId)
    items.push({
      problemId: input.problemId,
      sortOrder: input.sortOrder,
      problem: problem ? { id: problem.id, title: problem.title } : null,
    })
    found.detail.items = items
  }

  /**
   * Replace collection items ordering.
   * @param id - Collection id.
   * @param input - Reorder input.
   */
  async reorderItems(id: string, input: ReorderCollectionInput): Promise<void> {
    const found = mockStore.collections.find((record) => record.detail.id === id)
    if (!found) throw new Error('Collection not found')
    const items = input.items.map((item) => {
      const problem = mockStore.problems.find((entry) => entry.id === item.problemId)
      return {
        problemId: item.problemId,
        sortOrder: item.sortOrder,
        problem: problem ? { id: problem.id, title: problem.title } : null,
      }
    })
    found.detail.items = items
  }
}
