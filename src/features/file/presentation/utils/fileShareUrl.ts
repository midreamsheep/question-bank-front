/**
 * @file File share URL helpers.
 *
 * The backend may return storage/internal URLs (e.g. MinIO on 127.0.0.1:9000).
 * For browser access we prefer the stable controller route: `${apiBaseUrl}/files/share/{shareKey}`.
 */

import { runtimeConfig } from '../../../../infrastructure/config'
import { getMockFileDataUrl } from '../../mock/mockFileRegistry'

export type UploadLike = {
  shareKey?: string | null
}

/**
 * Build the public share URL for a file shareKey.
 * @param shareKey - File share key.
 * @returns Absolute URL (or empty string when shareKey is empty).
 */
export function buildFileShareUrl(shareKey: string): string {
  const cleaned = String(shareKey ?? '').trim()
  if (!cleaned) return ''
  const base = runtimeConfig.apiBaseUrl.replace(/\/$/, '')
  return `${base}/files/share/${encodeURIComponent(cleaned)}`
}

/**
 * Resolve a public URL for a file upload-like object.
 * @param upload - Object containing a shareKey.
 * @returns Public URL usable by `<img src>` (or empty string).
 */
export function toPublicFileUrl(upload: UploadLike): string {
  const shareKey = String(upload.shareKey ?? '').trim()
  if (!shareKey) return ''
  if (runtimeConfig.useMock) {
    const dataUrl = getMockFileDataUrl(shareKey)
    if (dataUrl) return dataUrl
  }
  return buildFileShareUrl(shareKey)
}
