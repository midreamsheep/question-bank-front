/**
 * @file Get presigned URL use case.
 */
import type { FileRepository } from '../ports/fileRepository'
import type { PresignedUrlResult } from '../models'
import type { GetPresignedUrlInput } from '../ports/fileRepository'

export type GetPresignedUrlUseCase = {
  execute(input: GetPresignedUrlInput): Promise<PresignedUrlResult>
}

/**
 * Create get presigned URL use case.
 * @param repository File repository
 * @returns use case
 */
export function createGetPresignedUrlUseCase(
  repository: FileRepository,
): GetPresignedUrlUseCase {
  return {
    async execute(input: GetPresignedUrlInput): Promise<PresignedUrlResult> {
      return repository.getPresignedUrl(input)
    },
  }
}
