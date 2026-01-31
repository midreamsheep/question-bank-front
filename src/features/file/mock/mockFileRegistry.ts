/**
 * @file In-memory mock registry for file shareKey -> data URL mapping.
 *
 * Used to make image previews work when the app runs in mock mode without a real `/files/share/{shareKey}` route.
 */

const mockFileDataUrlByShareKey = new Map<string, string>()
const mockShareKeyById = new Map<string, string>()

/**
 * Save a mapping from fileId to shareKey in mock mode.
 * @param fileId - File id.
 * @param shareKey - Share key.
 */
export function setMockFileShareKey(fileId: string, shareKey: string): void {
  mockShareKeyById.set(fileId, shareKey)
}

/**
 * Get shareKey by fileId from the mock registry.
 * @param fileId - File id.
 * @returns Share key if present.
 */
export function getMockShareKeyByFileId(fileId: string): string | undefined {
  return mockShareKeyById.get(fileId)
}

/**
 * Save a mapping from shareKey to data URL for previews in mock mode.
 * @param shareKey - Share key.
 * @param dataUrl - Data URL.
 */
export function setMockFileDataUrl(shareKey: string, dataUrl: string): void {
  mockFileDataUrlByShareKey.set(shareKey, dataUrl)
}

/**
 * Get data URL by shareKey from the mock registry.
 * @param shareKey - Share key.
 * @returns Data URL if present.
 */
export function getMockFileDataUrl(shareKey: string): string | undefined {
  return mockFileDataUrlByShareKey.get(shareKey)
}
