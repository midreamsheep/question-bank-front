/**
 * @file Mock file repository.
 */
import type { FileRepository, GetShareKeyInput } from '../domain/ports/fileRepository'
import type { ShareKeyResult, UploadFileResult } from '../domain/models'
import { getMockShareKeyByFileId, setMockFileDataUrl, setMockFileShareKey } from './mockFileRegistry'

let nextMockFileId = 1

/**
 * Convert a File into a data URL for preview in mock mode.
 * @param file - Browser file object.
 * @returns Data URL string.
 */
async function toDataUrl(file: File): Promise<string> {
  // `FileReader` exists in the browser; mock repo is only used in the frontend runtime.
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  })
}

export class MockFileRepository implements FileRepository {
  /**
   * Upload a file (mock): stores shareKey mapping and optional image data URL.
   * @param file - File to upload.
   * @returns Upload result containing id and shareKey.
   */
  async upload(file: File): Promise<UploadFileResult> {
    const id = String(nextMockFileId++)
    const shareKey = `mock-share-${id}`
    setMockFileShareKey(id, shareKey)

    if (file.type.startsWith('image/')) {
      try {
        const dataUrl = await toDataUrl(file)
        setMockFileDataUrl(shareKey, dataUrl)
      } catch {
        // Best-effort: keep upload usable even if we can't read bytes.
      }
    }

    return {
      id,
      shareKey,
      originalFilename: file.name,
      size: file.size,
      contentType: file.type || 'application/octet-stream',
    }
  }

  /**
   * Resolve shareKey by fileId (mock).
   * @param input - Share key query input.
   * @returns Share key result.
   */
  async getShareKey(input: GetShareKeyInput): Promise<ShareKeyResult> {
    const fileId = String(input.fileId ?? '').trim()
    if (!fileId) throw new Error('fileId is required')
    const shareKey = getMockShareKeyByFileId(fileId)
    if (!shareKey) throw new Error('Unknown fileId')
    return { shareKey }
  }
}
