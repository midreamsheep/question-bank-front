/**
 * @file 基于 Web Storage 的 JSON 读写封装。
 */
export type JsonStorage = {
  get<T>(key: string): T | null
  set<T>(key: string, value: T): void
  remove(key: string): void
}

/**
 * 创建 JSON Storage（对 Storage 进行 JSON 序列化封装）。
 * @param storage Web Storage 实例（localStorage/sessionStorage）
 * @returns JsonStorage
 */
export function createJsonStorage(storage: Storage): JsonStorage {
  return {
    get<T>(key: string): T | null {
      const raw = storage.getItem(key)
      if (raw === null) return null
      return JSON.parse(raw) as T
    },
    set<T>(key: string, value: T): void {
      storage.setItem(key, JSON.stringify(value))
    },
    remove(key: string): void {
      storage.removeItem(key)
    },
  }
}
