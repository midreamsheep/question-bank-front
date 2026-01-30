/**
 * @file Check health use case.
 */
import type { SystemRepository } from '../ports/systemRepository'
import type { HealthStatus } from '../models'

export type CheckHealthUseCase = {
  execute(): Promise<HealthStatus>
}

/**
 * Create check health use case.
 * @param repository System repository
 * @returns use case
 */
export function createCheckHealthUseCase(repository: SystemRepository): CheckHealthUseCase {
  return {
    async execute(): Promise<HealthStatus> {
      return repository.checkHealth()
    },
  }
}
