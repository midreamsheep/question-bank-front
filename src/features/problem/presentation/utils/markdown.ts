/**
 * @file Safe, feature-complete-ish Markdown renderer used by problem pages.
 *
 * Notes:
 * - Uses markdown-it for broad CommonMark/GFM-style parsing (no raw HTML).
 * - Hardens links/images with conservative allow-lists.
 * - Supports multi-line display math blocks delimited by `$$ ... $$` as a single DOM node for MathJax.
 * - Callers can provide optional URL resolvers (e.g. `/api/v1/files/share/<shareKey>` -> absolute URL).
 */

import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'

export type RenderMarkdownOptions = {
  resolveUrl?: (rawUrl: string) => string
  resolveImageUrl?: (rawUrl: string) => string
}

/**
 * Escape HTML special characters for safe HTML output.
 * @param value - Raw text.
 * @returns Escaped text.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Sanitize a link URL to a safe href value.
 * @param href - Raw link href.
 * @returns Safe href (or '#').
 */
function safeUrl(href: string): string {
  const trimmed = href.trim()
  if (!trimmed) return '#'
  const lowered = trimmed.toLowerCase()
  if (lowered.startsWith('javascript:')) return '#'
  if (lowered.startsWith('vbscript:')) return '#'
  if (lowered.startsWith('data:')) return '#'

  // Allow common safe schemes, hash links, and relative URLs.
  if (
    lowered.startsWith('http://') ||
    lowered.startsWith('https://') ||
    lowered.startsWith('mailto:') ||
    lowered.startsWith('tel:') ||
    lowered.startsWith('#') ||
    lowered.startsWith('/') ||
    lowered.startsWith('./') ||
    lowered.startsWith('../')
  ) {
    return trimmed
  }

  return '#'
}

/**
 * Sanitize an image URL to a safe src value.
 * @param src - Raw image src.
 * @returns Safe src (or empty string to indicate blocked).
 */
function safeImageUrl(src: string): string {
  const trimmed = src.trim()
  if (!trimmed) return ''
  const lowered = trimmed.toLowerCase()
  if (lowered.startsWith('javascript:')) return ''
  if (lowered.startsWith('vbscript:')) return ''

  // Allow typical image sources.
  if (lowered.startsWith('http://') || lowered.startsWith('https://') || lowered.startsWith('blob:')) {
    return trimmed
  }

  // Allow relative images (resolved by callers if needed).
  if (lowered.startsWith('/') || lowered.startsWith('./') || lowered.startsWith('../')) {
    return trimmed
  }

  // Allow a limited set of data URLs (avoid svg).
  if (lowered.startsWith('data:image/png;') || lowered.startsWith('data:image/jpeg;') || lowered.startsWith('data:image/webp;') || lowered.startsWith('data:image/gif;')) {
    return trimmed
  }

  return ''
}

type RenderEnv = RenderMarkdownOptions

/**
 * Resolve and sanitize link href for markdown rendering.
 * @param raw - Raw href from markdown tokens.
 * @param env - Render env with optional resolvers.
 * @returns Safe href.
 */
function resolveLinkHref(raw: string, env: RenderEnv): string {
  const resolved = env.resolveUrl ? env.resolveUrl(raw) : raw
  return safeUrl(resolved)
}

/**
 * Resolve and sanitize image src for markdown rendering.
 * @param raw - Raw src from markdown tokens.
 * @param env - Render env with optional resolvers.
 * @returns Safe src (or empty string).
 */
function resolveImageSrc(raw: string, env: RenderEnv): string {
  const resolved = env.resolveImageUrl ? env.resolveImageUrl(raw) : raw
  return safeImageUrl(resolved)
}

/**
 * Create a configured markdown-it instance (no raw HTML, safe URLs, math blocks).
 * @returns Configured markdown-it instance.
 */
function createMarkdownIt(): MarkdownIt {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    // Make textarea-friendly: single newlines become <br/>.
    breaks: true,
  })

  md.use(taskLists, { enabled: true })

  md.block.ruler.before('fence', 'math_block', (state, startLine, endLine, silent) => {
    const startPos = (state.bMarks[startLine] ?? 0) + (state.tShift[startLine] ?? 0)
    const startMax = state.eMarks[startLine] ?? startPos
    const firstLine = state.src.slice(startPos, startMax)
    if (!firstLine.trim().startsWith('$$')) return false
    if (silent) return true

    const lines: string[] = []
    let nextLine = startLine
    let found = false

    while (nextLine < endLine) {
      const pos = (state.bMarks[nextLine] ?? 0) + (state.tShift[nextLine] ?? 0)
      const max = state.eMarks[nextLine] ?? pos
      const line = state.src.slice(pos, max)
      lines.push(line)

      const trimmed = line.trim()
      if (
        nextLine === startLine &&
        trimmed.startsWith('$$') &&
        trimmed.endsWith('$$') &&
        trimmed.length > 4
      ) {
        found = true
        nextLine += 1
        break
      }
      if (nextLine !== startLine && trimmed.endsWith('$$')) {
        found = true
        nextLine += 1
        break
      }

      nextLine += 1
    }

    if (!found) return false

    const token = state.push('math_block', 'div', 0)
    token.block = true
    token.content = lines.join('\n')
    state.line = nextLine
    return true
  })

  md.renderer.rules.math_block = (tokens, idx) => {
    return `<div class="md__math">${escapeHtml(tokens[idx]?.content ?? '')}</div>`
  }

  type TokenWithAttrs = {
    attrJoin(name: string, value: string): void
    attrGet(name: string): string | null
    attrSet(name: string, value: string): void
    content?: string
  }

  const addClass = (token: TokenWithAttrs, className: string) => token.attrJoin('class', className)

  const renderToken = md.renderer.renderToken.bind(md.renderer)

  md.renderer.rules.paragraph_open = (tokens, idx, options) => {
    addClass(tokens[idx] as unknown as TokenWithAttrs, 'md__p')
    return renderToken(tokens, idx, options)
  }
  md.renderer.rules.heading_open = (tokens, idx, options) => {
    addClass(tokens[idx] as unknown as TokenWithAttrs, 'md__h')
    return renderToken(tokens, idx, options)
  }
  md.renderer.rules.bullet_list_open = (tokens, idx, options) => {
    addClass(tokens[idx] as unknown as TokenWithAttrs, 'md__ul')
    return renderToken(tokens, idx, options)
  }
  md.renderer.rules.ordered_list_open = (tokens, idx, options) => {
    addClass(tokens[idx] as unknown as TokenWithAttrs, 'md__ol')
    return renderToken(tokens, idx, options)
  }
  md.renderer.rules.list_item_open = (tokens, idx, options) => {
    addClass(tokens[idx] as unknown as TokenWithAttrs, 'md__li')
    return renderToken(tokens, idx, options)
  }
  md.renderer.rules.blockquote_open = (tokens, idx, options) => {
    addClass(tokens[idx] as unknown as TokenWithAttrs, 'md__blockquote')
    return renderToken(tokens, idx, options)
  }

  md.renderer.rules.code_inline = (tokens, idx) => {
    return `<code class="md__code">${escapeHtml(tokens[idx]?.content ?? '')}</code>`
  }

  md.renderer.rules.fence = (tokens, idx) => {
    return `<pre class="md__pre"><code>${escapeHtml(tokens[idx]?.content ?? '')}</code></pre>\n`
  }
  md.renderer.rules.code_block = (tokens, idx) => {
    return `<pre class="md__pre"><code>${escapeHtml(tokens[idx]?.content ?? '')}</code></pre>\n`
  }

  md.renderer.rules.link_open = (tokens, idx, options, env) => {
    const token = tokens[idx] as unknown as TokenWithAttrs
    addClass(token, 'link')
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
    const href = token.attrGet('href') ?? ''
    const safeHref = resolveLinkHref(href, (env ?? {}) as RenderEnv)
    token.attrSet('href', safeHref)
    return renderToken(tokens, idx, options)
  }

  md.renderer.rules.image = (tokens, idx, _options, env) => {
    const token = tokens[idx] as unknown as TokenWithAttrs
    const rawSrc = token.attrGet('src') ?? ''
    const alt = token.content || token.attrGet('alt') || 'image'
    const safeSrc = resolveImageSrc(rawSrc, (env ?? {}) as RenderEnv)
    if (!safeSrc) {
      return `<span class="md__img_placeholder">[image: ${escapeHtml(String(alt))}]</span>`
    }
    return `<img class="md__img" src="${escapeHtml(safeSrc)}" alt="${escapeHtml(String(alt))}" loading="lazy" />`
  }

  return md
}

const md = createMarkdownIt()

/**
 * Render Markdown to HTML for previews/details.
 * @param source - Markdown source text.
 * @param options - Render options.
 * @returns Rendered HTML string.
 */
export function renderMarkdown(source: string, options: RenderMarkdownOptions = {}): string {
  return md.render(source ?? '', options)
}
