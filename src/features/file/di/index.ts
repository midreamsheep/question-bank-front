/**
 * @file File feature DI: exports dependencies.
 */
import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { HttpClient } from '../../../infrastructure/http'
import { HttpFileRepository } from '../data/httpFileRepository'
import { MockFileRepository } from '../mock/mockFileRepository'
import { createUploadFileUseCase } from '../domain/useCases/uploadFileUseCase'
import { createGetPresignedUrlUseCase } from '../domain/useCases/getPresignedUrlUseCase'
import type { UploadFileUseCase } from '../domain/useCases/uploadFileUseCase'
import type { GetPresignedUrlUseCase } from '../domain/useCases/getPresignedUrlUseCase'

export type FileDi = {
  uploadUseCase: UploadFileUseCase
  presignedUrlUseCase: GetPresignedUrlUseCase
}

/**
 * File DI injection key.
 */
export const fileDiKey: InjectionKey<FileDi> = Symbol('fileDi')

/**
 * Create file DI dependencies.
 * @param options DI options
 * @param options.httpClient HTTP client
 * @returns File DI container
 */
export function makeFileDi(options: { httpClient: HttpClient; useMock?: boolean }): FileDi {
  const repository = options.useMock
    ? new MockFileRepository()
    : new HttpFileRepository({ httpClient: options.httpClient })
  return {
    uploadUseCase: createUploadFileUseCase(repository),
    presignedUrlUseCase: createGetPresignedUrlUseCase(repository),
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
