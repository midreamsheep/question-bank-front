/**
 * @file Collection feature DI: exports routes and dependencies.
 */
import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { HttpClient } from '../../../infrastructure/http'
import CollectionListPage from '../presentation/pages/CollectionListPage.vue'
import CollectionDetailPage from '../presentation/pages/CollectionDetailPage.vue'
import CollectionSharePage from '../presentation/pages/CollectionSharePage.vue'
import CollectionEditorPage from '../presentation/pages/CollectionEditorPage.vue'
import MyCollectionListPage from '../presentation/pages/MyCollectionListPage.vue'
import { HttpCollectionRepository } from '../data/httpCollectionRepository'
import { MockCollectionRepository } from '../mock/mockCollectionRepository'
import { createListCollectionsUseCase } from '../domain/useCases/listCollectionsUseCase'
import { createListMyCollectionsUseCase } from '../domain/useCases/listMyCollectionsUseCase'
import { createGetCollectionDetailUseCase } from '../domain/useCases/getCollectionDetailUseCase'
import { createGetCollectionByShareKeyUseCase } from '../domain/useCases/getCollectionByShareKeyUseCase'
import { createCreateCollectionUseCase } from '../domain/useCases/createCollectionUseCase'
import { createUpdateCollectionUseCase } from '../domain/useCases/updateCollectionUseCase'
import { createDeleteCollectionUseCase } from '../domain/useCases/deleteCollectionUseCase'
import { createAddCollectionItemUseCase } from '../domain/useCases/addCollectionItemUseCase'
import { createReorderCollectionItemsUseCase } from '../domain/useCases/reorderCollectionItemsUseCase'
import type { ListCollectionsUseCase } from '../domain/useCases/listCollectionsUseCase'
import type { ListMyCollectionsUseCase } from '../domain/useCases/listMyCollectionsUseCase'
import type { GetCollectionDetailUseCase } from '../domain/useCases/getCollectionDetailUseCase'
import type { GetCollectionByShareKeyUseCase } from '../domain/useCases/getCollectionByShareKeyUseCase'
import type { CreateCollectionUseCase } from '../domain/useCases/createCollectionUseCase'
import type { UpdateCollectionUseCase } from '../domain/useCases/updateCollectionUseCase'
import type { DeleteCollectionUseCase } from '../domain/useCases/deleteCollectionUseCase'
import type { AddCollectionItemUseCase } from '../domain/useCases/addCollectionItemUseCase'
import type { ReorderCollectionItemsUseCase } from '../domain/useCases/reorderCollectionItemsUseCase'

export type CollectionDi = {
  listUseCase: ListCollectionsUseCase
  listMineUseCase: ListMyCollectionsUseCase
  getDetailUseCase: GetCollectionDetailUseCase
  getByShareKeyUseCase: GetCollectionByShareKeyUseCase
  createUseCase: CreateCollectionUseCase
  updateUseCase: UpdateCollectionUseCase
  deleteUseCase: DeleteCollectionUseCase
  addItemUseCase: AddCollectionItemUseCase
  reorderItemsUseCase: ReorderCollectionItemsUseCase
}

/**
 * Collection DI injection key.
 */
export const collectionDiKey: InjectionKey<CollectionDi> = Symbol('collectionDi')

/**
 * Create collection DI dependencies.
 * @param options DI options
 * @param options.httpClient HTTP client
 * @param options.useMock Use mock repositories instead of HTTP ones
 * @returns Collection DI container
 */
export function makeCollectionDi(options: { httpClient: HttpClient; useMock?: boolean }): CollectionDi {
  const repository = options.useMock
    ? new MockCollectionRepository()
    : new HttpCollectionRepository({ httpClient: options.httpClient })
  return {
    listUseCase: createListCollectionsUseCase(repository),
    listMineUseCase: createListMyCollectionsUseCase(repository),
    getDetailUseCase: createGetCollectionDetailUseCase(repository),
    getByShareKeyUseCase: createGetCollectionByShareKeyUseCase(repository),
    createUseCase: createCreateCollectionUseCase(repository),
    updateUseCase: createUpdateCollectionUseCase(repository),
    deleteUseCase: createDeleteCollectionUseCase(repository),
    addItemUseCase: createAddCollectionItemUseCase(repository),
    reorderItemsUseCase: createReorderCollectionItemsUseCase(repository),
  }
}

/**
 * Use collection DI container.
 * @returns Collection DI container
 */
export function useCollectionDi(): CollectionDi {
  const di = inject(collectionDiKey)
  if (!di) throw new Error('Collection DI not provided')
  return di
}

/**
 * Public routes for collections.
 */
export const collectionPublicRoutes: RouteRecordRaw[] = [
  {
    path: 'collections',
    name: 'collections',
    component: CollectionListPage,
  },
  {
    path: 'collections/share/:shareKey',
    name: 'collection-share',
    component: CollectionSharePage,
  },
  {
    path: 'collections/:id',
    name: 'collection-detail',
    component: CollectionDetailPage,
  },
]

/**
 * Authenticated routes for collections.
 */
export const collectionAccountRoutes: RouteRecordRaw[] = [
  {
    path: 'collections',
    name: 'my-collections',
    component: MyCollectionListPage,
    meta: { requiresAuth: true },
  },
  {
    path: 'collections/new',
    name: 'collection-create',
    component: CollectionEditorPage,
    meta: { requiresAuth: true },
  },
  {
    path: 'collections/:id/edit',
    name: 'collection-edit',
    component: CollectionEditorPage,
    meta: { requiresAuth: true },
  },
]
