/**
 * @file 通用 HTTP Client 抽象与基于 Fetch 的实现。
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type HttpQueryPrimitive = string | number | boolean
export type HttpQueryValue = HttpQueryPrimitive | HttpQueryPrimitive[] | null | undefined

export type HttpRequestOptions = {
  method: HttpMethod
  url: string
  query?: Record<string, HttpQueryValue>
  headers?: Record<string, string>
  body?: unknown
}

export class HttpError extends Error {
  readonly status?: number
  readonly body?: unknown

  /**
   * 构造 HTTP 错误。
   * @param message 错误信息
   * @param options 额外信息（状态码/原始错误）
   * @param options.status HTTP 状态码
   * @param options.cause 原始错误
   * @param options.body 错误响应体（如能解析）
   */
  constructor(message: string, options?: { status?: number; cause?: unknown; body?: unknown }) {
    super(message)
    this.name = 'HttpError'
    this.status = options?.status
    this.body = options?.body
    ;(this as { cause?: unknown }).cause = options?.cause
  }
}

export type HttpClient = {
  request<T>(options: HttpRequestOptions): Promise<T>
}

function isJsonContentType(contentType: string): boolean {
  return contentType.includes('application/json') || contentType.includes('+json')
}

function isSafeIntegerString(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  const negative = trimmed.startsWith('-')
  const digits = (negative ? trimmed.slice(1) : trimmed).replace(/^0+(?=\d)/, '')
  if (!digits) return true

  // Fast path: <= 15 digits is always safe.
  if (digits.length <= 15) return true

  // MAX_SAFE_INTEGER = 9007199254740991 (16 digits)
  const max = '9007199254740991'
  if (digits.length > max.length) return false
  if (digits.length < max.length) return true
  return digits <= max
}

/**
 * Parse JSON text but preserve integers beyond Number.MAX_SAFE_INTEGER as strings.
 *
 * This prevents JS Number precision loss for 64-bit ids (Snowflake, etc.).
 */
function parseJsonPreserveBigInt(text: string): unknown {
  let out = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i] ?? ''

    if (inString) {
      out += ch
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      out += ch
      continue
    }

    const isNumberStart = ch === '-' || (ch >= '0' && ch <= '9')
    if (!isNumberStart) {
      out += ch
      continue
    }

    // Read number token.
    let j = i
    let token = ''
    while (j < text.length) {
      const c = text[j] ?? ''
      const isNumberChar =
        (c >= '0' && c <= '9') || c === '-' || c === '+' || c === '.' || c === 'e' || c === 'E'
      if (!isNumberChar) break
      token += c
      j += 1
    }

    const isInteger = !token.includes('.') && !token.includes('e') && !token.includes('E')
    if (isInteger && !isSafeIntegerString(token)) {
      out += `"${token}"`
    } else {
      out += token
    }
    i = j - 1
  }

  return JSON.parse(out)
}

/**
 * 构造最终请求 URL（拼接 baseUrl 与 query 参数）。
 * @param baseUrl 基础地址
 * @param url 相对或绝对路径
 * @param query 查询参数
 * @returns 拼接后的完整 URL
 */
function buildUrl(baseUrl: string, url: string, query?: HttpRequestOptions['query']): string {
  const full = url.startsWith('http')
    ? url
    : `${baseUrl.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`
  const hasQuery = query && Object.keys(query).length > 0
  if (!hasQuery) return full

  const u = full.startsWith('http') ? new URL(full) : new URL(full, window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === null || value === undefined) continue
    if (Array.isArray(value)) {
      // Standard "repeat key" form: ?tagIds=1&tagIds=2
      for (const entry of value) {
        u.searchParams.append(key, String(entry))
      }
      continue
    }
    u.searchParams.set(key, String(value))
  }
  return u.toString()
}

/**
 * 创建 HttpClient（Fetch 实现）。
 * @param options baseUrl 与默认请求头
 * @param options.baseUrl 基础地址
 * @param options.defaultHeaders 默认请求头
 * @param options.getAuthToken 获取当前 token（可选，用于自动注入 Authorization）
 * @returns HttpClient 实例
 */
export function createHttpClient(options: {
  baseUrl: string
  defaultHeaders?: Record<string, string>
  getAuthToken?: () => string | null
}): HttpClient {
  return {
    async request<T>({ method, url, query, headers, body }: HttpRequestOptions): Promise<T> {
      const finalUrl = buildUrl(options.baseUrl, url, query)
      const finalHeaders: Record<string, string> = {
        ...(options.defaultHeaders ?? {}),
        ...(headers ?? {}),
      }
      const isBodyInit = (value: unknown): value is BodyInit => {
        if (typeof value === 'string') return true
        if (typeof FormData !== 'undefined' && value instanceof FormData) return true
        if (typeof Blob !== 'undefined' && value instanceof Blob) return true
        if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) return true
        if (value instanceof ArrayBuffer) return true
        if (ArrayBuffer.isView(value)) return true
        return false
      }

      const shouldSerializeJson =
        body !== undefined &&
        !isBodyInit(body) &&
        typeof body === 'object' &&
        !Array.isArray(body)

      if (shouldSerializeJson && finalHeaders['content-type'] === undefined) {
        finalHeaders['content-type'] = 'application/json'
      }
      const token = options.getAuthToken?.()
      if (token && finalHeaders.authorization === undefined) {
        finalHeaders.authorization = `Bearer ${token}`
      }

      const finalBody =
        body === undefined
          ? undefined
          : shouldSerializeJson
            ? JSON.stringify(body)
            : (body as BodyInit)

      const res = await fetch(finalUrl, {
        method,
        headers: finalHeaders,
        body: finalBody,
      })

      const contentType = res.headers.get('content-type') ?? ''
      const isJson = isJsonContentType(contentType)

      if (!res.ok) {
        let responseBody: unknown = undefined
        try {
          const raw = await res.text()
          responseBody = isJson ? parseJsonPreserveBigInt(raw) : raw
        } catch {
          responseBody = undefined
        }

        const message =
          typeof responseBody === 'object' && responseBody && 'message' in responseBody
            ? String((responseBody as { message?: unknown }).message ?? `HTTP ${res.status}`)
            : `HTTP ${res.status} ${res.statusText}`

        throw new HttpError(message, { status: res.status, body: responseBody })
      }

      if (res.status === 204) return undefined as T
      const raw = await res.text()
      if (!isJson) return raw as unknown as T
      return parseJsonPreserveBigInt(raw) as T
    },
  }
}
