/**
 * @file Taxonomy repository port.
 */
import type { Category, ProblemType, Tag, TaxonomyQuery } from '../models'

export type TaxonomyRepository = {
  listCategories(query?: TaxonomyQuery): Promise<Category[]>
  listProblemTypes(query?: TaxonomyQuery): Promise<ProblemType[]>
  listTags(query?: TaxonomyQuery): Promise<Tag[]>
}
