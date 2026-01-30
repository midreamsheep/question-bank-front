/**
 * @file Comment feature DI: exports dependencies.
 */

import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { HttpClient } from '../../../infrastructure/http'
import { HttpCommentRepository } from '../data/httpCommentRepository'
import { MockCommentRepository } from '../mock/mockCommentRepository'
import { createListCommentsUseCase } from '../domain/useCases/listCommentsUseCase'
import { createCreateCommentUseCase } from '../domain/useCases/createCommentUseCase'
import type { ListCommentsUseCase } from '../domain/useCases/listCommentsUseCase'
import type { CreateCommentUseCase } from '../domain/useCases/createCommentUseCase'

export type CommentDi = {
  listUseCase: ListCommentsUseCase
  createUseCase: CreateCommentUseCase
}

export const commentDiKey: InjectionKey<CommentDi> = Symbol('commentDi')

export function makeCommentDi(options: { httpClient: HttpClient; useMock?: boolean }): CommentDi {
  const repository = options.useMock
    ? new MockCommentRepository()
    : new HttpCommentRepository({ httpClient: options.httpClient })
  return {
    listUseCase: createListCommentsUseCase(repository),
    createUseCase: createCreateCommentUseCase(repository),
  }
}

export function useCommentDi(): CommentDi {
  const di = inject(commentDiKey)
  if (!di) throw new Error('Comment DI not provided')
  return di
}

