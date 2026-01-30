/**
 * @file Collection domain models.
 */

export type CollectionVisibility = 'PUBLIC' | 'UNLISTED' | 'PRIVATE'

export type CollectionStatus = 'ACTIVE' | 'DISABLED'

export type CollectionSummary = {
  id: string
  name: string
  description?: string | null
  visibility: CollectionVisibility
  status: CollectionStatus
  itemCount: number
  authorId: string
}

export type CollectionItem = {
  problemId: string
  sortOrder?: number
  problem?: {
    id: string
    title: string
  } | null
}

export type CollectionDetail = {
  id: string
  name: string
  description?: string | null
  visibility: CollectionVisibility
  shareKey?: string | null
  status: CollectionStatus
  items?: CollectionItem[]
}

export type CreateCollectionInput = {
  name: string
  description?: string | null
  visibility: CollectionVisibility
}

export type UpdateCollectionInput = CreateCollectionInput

export type CollectionListQuery = {
  page?: number
  pageSize?: number
  status?: CollectionStatus
  authorId?: string
}

export type AddCollectionItemInput = {
  problemId: string
  sortOrder?: number
}

export type ReorderCollectionInput = {
  items: Array<{ problemId: string; sortOrder: number }>
}

export type PageResponse<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export type CollectionCreateResponse = {
  id: string
  status: CollectionStatus
  visibility: CollectionVisibility
  shareKey?: string | null
}
