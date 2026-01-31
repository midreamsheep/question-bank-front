/**
 * @file File feature DI: exports dependencies.
 */
import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { HttpClient } from '../../../infrastructure/http'
import { HttpFileRepository } from '../data/httpFileRepository'
import { MockFileRepository } from '../mock/mockFileRepository'
import { createUploadFileUseCase } from '../domain/useCases/uploadFileUseCase'
import { createGetShareKeyUseCase } from '../domain/useCases/getShareKeyUseCase'
import type { UploadFileUseCase } from '../domain/useCases/uploadFileUseCase'
import type { GetShareKeyUseCase } from '../domain/useCases/getShareKeyUseCase'

export type FileDi = {
  uploadUseCase: UploadFileUseCase
  shareKeyUseCase: GetShareKeyUseCase
}

/**
 * File DI injection key.
 */
export const fileDiKey: InjectionKey<FileDi> = Symbol('fileDi')

/**
 * Create file DI dependencies.
 * @param options DI options
 * @param options.httpClient HTTP client
 * @param options.useMock Use mock repositories instead of HTTP ones
 * @returns File DI container
 */
export function makeFileDi(options: { httpClient: HttpClient; useMock?: boolean }): FileDi {
  const repository = options.useMock
    ? new MockFileRepository()
    : new HttpFileRepository({ httpClient: options.httpClient })
  return {
    uploadUseCase: createUploadFileUseCase(repository),
    shareKeyUseCase: createGetShareKeyUseCase(repository),
  }
}

/**
 * Use file DI container.
 * @returns File DI container
 */
export function useFileDi(): FileDi {
  const di = inject(fileDiKey)
  if (!di) throw new Error('File DI not provided')
  return di
}
