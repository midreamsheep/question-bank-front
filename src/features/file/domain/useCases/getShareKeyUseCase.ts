/**
 * @file Get shareKey by fileId use case.
 */
import type { FileRepository } from '../ports/fileRepository'
import type { ShareKeyResult } from '../models'
import type { GetShareKeyInput } from '../ports/fileRepository'

export type GetShareKeyUseCase = {
  execute(input: GetShareKeyInput): Promise<ShareKeyResult>
}

/**
 * Create get shareKey use case.
 * @param repository File repository
 * @returns use case
 */
export function createGetShareKeyUseCase(repository: FileRepository): GetShareKeyUseCase {
  return {
    async execute(input: GetShareKeyInput): Promise<ShareKeyResult> {
      return repository.getShareKey(input)
    },
  }
}

