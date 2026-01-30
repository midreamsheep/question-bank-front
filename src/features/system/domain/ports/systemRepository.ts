/**
 * @file System repository port.
 */
import type { HealthStatus } from '../models'

export type SystemRepository = {
  checkHealth(): Promise<HealthStatus>
}
