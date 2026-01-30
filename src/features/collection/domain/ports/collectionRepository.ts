/**
 * @file Collection repository port.
 */
import type {
  AddCollectionItemInput,
  CollectionDetail,
  CollectionCreateResponse,
  CollectionListQuery,
  CollectionSummary,
  CreateCollectionInput,
  PageResponse,
  ReorderCollectionInput,
  UpdateCollectionInput,
} from '../models'

export type CollectionRepository = {
  list(query: CollectionListQuery): Promise<PageResponse<CollectionSummary>>
  listMine(query: CollectionListQuery): Promise<PageResponse<CollectionSummary>>
  getDetail(id: string): Promise<CollectionDetail>
  getByShareKey(shareKey: string): Promise<CollectionDetail>
  create(input: CreateCollectionInput): Promise<CollectionCreateResponse>
  update(id: string, input: UpdateCollectionInput): Promise<CollectionDetail>
  delete(id: string): Promise<void>
  addItem(id: string, input: AddCollectionItemInput): Promise<void>
  reorderItems(id: string, input: ReorderCollectionInput): Promise<void>
}
