/**
 * @file 日志抽象与默认 Console 实现。
 */
export type Logger = {
  info(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  error(message: string, meta?: Record<string, unknown>): void
}

/**
 * 创建 Console Logger。
 * @returns Logger
 */
export function createConsoleLogger(): Logger {
  return {
    info(message, meta) {
      console.info(message, meta)
    },
    warn(message, meta) {
      console.warn(message, meta)
    },
    error(message, meta) {
      console.error(message, meta)
    },
  }
}
