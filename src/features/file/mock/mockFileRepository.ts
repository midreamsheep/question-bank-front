/**
 * @file Mock file repository.
 */
import type { FileRepository } from '../domain/ports/fileRepository'
import type { PresignedUrlResult, UploadFileResult } from '../domain/models'
import type { GetPresignedUrlInput } from '../domain/ports/fileRepository'

const mockFileDataUrlByObjectKey = new Map<string, string>()
const mockObjectKeyById = new Map<number, string>()
let nextMockFileId = 1

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
  async upload(file: File): Promise<UploadFileResult> {
    const id = nextMockFileId++
    const objectKey = `mock/${Date.now()}-${file.name}`
    mockObjectKeyById.set(id, objectKey)
    const shareKey = `mock-share-${id}`
    let shareUrl = `/api/v1/files/share/${shareKey}`
    if (file.type.startsWith('image/')) {
      try {
        const dataUrl = await toDataUrl(file)
        mockFileDataUrlByObjectKey.set(objectKey, dataUrl)
        // Mock-mode: make <img src="shareUrl"> work without a real server route.
        shareUrl = dataUrl
      } catch {
        // Best-effort: keep upload usable even if we can't read bytes.
      }
    }

    return {
      id: String(id),
      shareKey,
      shareUrl,
      objectKey,
      originalFilename: file.name,
      size: file.size,
      contentType: file.type || 'application/octet-stream',
    }
  }

  async getPresignedUrl(input: GetPresignedUrlInput): Promise<PresignedUrlResult> {
    const fileId = Number(input.fileId)
    const objectKey = Number.isFinite(fileId) ? mockObjectKeyById.get(fileId) : undefined
    if (!objectKey) throw new Error('Unknown fileId')
    const dataUrl = mockFileDataUrlByObjectKey.get(objectKey)
    if (dataUrl) return { url: dataUrl }
    return {
      url: `https://mock.local/${objectKey}`,
    }
  }
}
