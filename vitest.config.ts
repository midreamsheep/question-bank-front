import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Default to node to keep the test runner fast and stable.
    // Component tests can opt into jsdom via `// @vitest-environment jsdom`.
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    // Avoid fork startup flakiness/timeouts in constrained CI/sandbox environments.
    pool: 'threads',
    maxWorkers: 1,
    fileParallelism: false,
  },
})
