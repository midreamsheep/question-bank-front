/**
 * @file Mock taxonomy repository.
 */
import type { TaxonomyRepository } from '../domain/ports/taxonomyRepository'
import type { Category, ProblemType, Tag, TaxonomyQuery } from '../domain/models'
import { taxonomyStore } from './mockTaxonomyStore'

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
  async listCategories(query?: TaxonomyQuery): Promise<Category[]> {
    return filterByQuery(taxonomyStore.categories, query)
  }

  async listProblemTypes(query?: TaxonomyQuery): Promise<ProblemType[]> {
    return filterByQuery(taxonomyStore.problemTypes, query)
  }

  async listTags(query?: TaxonomyQuery): Promise<Tag[]> {
    return filterByQuery(taxonomyStore.tags, query)
  }
}
