/**
 * @file Mock taxonomy repository.
 */
import type { TaxonomyRepository } from '../domain/ports/taxonomyRepository'
import type { Category, ProblemType, Tag, TaxonomyQuery } from '../domain/models'
import { taxonomyStore } from './mockTaxonomyStore'

/**
 * Filter taxonomy items by subject and keyword.
 * @param items - Source items.
 * @param query - Optional query.
 * @returns Filtered items.
 */
function filterByQuery<T extends { subject?: string | null; name: string }>(
  items: T[],
  query?: TaxonomyQuery,
): T[] {
  let result = items
  if (query?.subject) {
    result = result.filter((item) => item.subject === query.subject)
  }
  if (query?.keyword) {
    const keyword = query.keyword.toLowerCase()
    result = result.filter((item) => item.name.toLowerCase().includes(keyword))
  }
  return result
}

export class MockTaxonomyRepository implements TaxonomyRepository {
  /**
   * List categories.
   * @param query - Optional taxonomy query.
   * @returns Categories list.
   */
  async listCategories(query?: TaxonomyQuery): Promise<Category[]> {
    return filterByQuery(taxonomyStore.categories, query)
  }

  /**
   * List problem types.
   * @param query - Optional taxonomy query.
   * @returns Problem types list.
   */
  async listProblemTypes(query?: TaxonomyQuery): Promise<ProblemType[]> {
    return filterByQuery(taxonomyStore.problemTypes, query)
  }

  /**
   * List tags.
   * @param query - Optional taxonomy query.
   * @returns Tags list.
   */
  async listTags(query?: TaxonomyQuery): Promise<Tag[]> {
    return filterByQuery(taxonomyStore.tags, query)
  }
}
