/**
 * @file Taxonomy feature DI: exports dependencies.
 */
import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { HttpClient } from '../../../infrastructure/http'
import { HttpTaxonomyRepository } from '../data/httpTaxonomyRepository'
import { MockTaxonomyRepository } from '../mock/mockTaxonomyRepository'
import { createListCategoriesUseCase } from '../domain/useCases/listCategoriesUseCase'
import { createListProblemTypesUseCase } from '../domain/useCases/listProblemTypesUseCase'
import { createListTagsUseCase } from '../domain/useCases/listTagsUseCase'
import type { ListCategoriesUseCase } from '../domain/useCases/listCategoriesUseCase'
import type { ListProblemTypesUseCase } from '../domain/useCases/listProblemTypesUseCase'
import type { ListTagsUseCase } from '../domain/useCases/listTagsUseCase'

export type TaxonomyDi = {
  listCategoriesUseCase: ListCategoriesUseCase
  listProblemTypesUseCase: ListProblemTypesUseCase
  listTagsUseCase: ListTagsUseCase
}

/**
 * Taxonomy DI injection key.
 */
export const taxonomyDiKey: InjectionKey<TaxonomyDi> = Symbol('taxonomyDi')

/**
 * Create taxonomy DI dependencies.
 * @param options DI options
 * @param options.httpClient HTTP client
 * @param options.useMock Use mock repositories instead of HTTP ones
 * @returns Taxonomy DI container
 */
export function makeTaxonomyDi(options: { httpClient: HttpClient; useMock?: boolean }): TaxonomyDi {
  const repository = options.useMock
    ? new MockTaxonomyRepository()
    : new HttpTaxonomyRepository({ httpClient: options.httpClient })
  return {
    listCategoriesUseCase: createListCategoriesUseCase(repository),
    listProblemTypesUseCase: createListProblemTypesUseCase(repository),
    listTagsUseCase: createListTagsUseCase(repository),
  }
}

/**
 * Use taxonomy DI container.
 * @returns Taxonomy DI container
 */
export function useTaxonomyDi(): TaxonomyDi {
  const di = inject(taxonomyDiKey)
  if (!di) throw new Error('Taxonomy DI not provided')
  return di
}
