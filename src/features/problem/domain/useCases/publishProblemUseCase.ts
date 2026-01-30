/**
 * @file Publish problem use case.
 */
import type { ProblemRepository } from '../ports/problemRepository'
import type { PublishProblemInput, ProblemStatusResponse } from '../models'

export type PublishProblemUseCase = {
  execute(id: string, input?: PublishProblemInput): Promise<ProblemStatusResponse>
}

/**
 * Create publish-problem use case.
 * @param repository Problem repository
 * @returns use case
 */
export function createPublishProblemUseCase(repository: ProblemRepository): PublishProblemUseCase {
  return {
    async execute(id: string, input?: PublishProblemInput): Promise<ProblemStatusResponse> {
      return repository.publish(id, input)
    },
  }
}
