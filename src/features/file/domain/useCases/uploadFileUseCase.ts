/**
 * @file Upload file use case.
 */
import type { FileRepository } from '../ports/fileRepository'
import type { UploadFileResult } from '../models'

export type UploadFileUseCase = {
  execute(file: File): Promise<UploadFileResult>
}

/**
 * Create upload file use case.
 * @param repository File repository
 * @returns use case
 */
export function createUploadFileUseCase(repository: FileRepository): UploadFileUseCase {
  return {
    async execute(file: File): Promise<UploadFileResult> {
      return repository.upload(file)
    },
  }
}
