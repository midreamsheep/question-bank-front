/**
 * @file Mock system repository.
 */
import type { SystemRepository } from '../domain/ports/systemRepository'
import type { HealthStatus } from '../domain/models'

export class MockSystemRepository implements SystemRepository {
  async checkHealth(): Promise<HealthStatus> {
    return { ok: true }
  }
}
