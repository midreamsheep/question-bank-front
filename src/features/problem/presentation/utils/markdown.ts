/**
 * @file Minimal, safe markdown renderer used by problem pages.
 *
 * Notes:
 * - We escape user text and only allow a tiny subset of Markdown.
 * - Images are supported via `![alt](url)` and are rendered as <img>.
 * - Callers can provide optional URL resolvers (e.g. `/api/v1/files/share/<shareKey>` -> absolute URL).
 */

export type RenderMarkdownOptions = {
  resolveUrl?: (rawUrl: string) => string
  resolveImageUrl?: (rawUrl: string) => string
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeUrl(href: string): string {
  const trimmed = href.trim()
  if (!trimmed) return '#'
  const lowered = trimmed.toLowerCase()
  if (lowered.startsWith('javascript:')) return '#'
  // Keep links conservative; images can have a different policy.
  if (lowered.startsWith('data:')) return '#'
  return trimmed
}

function safeImageUrl(src: string): string {
  const trimmed = src.trim()
  if (!trimmed) return ''
  const lowered = trimmed.toLowerCase()
  if (lowered.startsWith('javascript:')) return ''

  // Allow typical image sources.
  if (lowered.startsWith('http://') || lowered.startsWith('https://') || lowered.startsWith('blob:')) {
    return trimmed
  }

  // Allow a limited set of data URLs (avoid svg).
  if (lowered.startsWith('data:image/png;') || lowered.startsWith('data:image/jpeg;') || lowered.startsWith('data:image/webp;') || lowered.startsWith('data:image/gif;')) {
    return trimmed
  }

  return ''
}

/**
 * Render minimal markdown to HTML.
 */
export function renderMarkdown(source: string, options: RenderMarkdownOptions = {}): string {
  const parts = source.split('```')

  const resolveLink = (raw: string) => safeUrl(options.resolveUrl ? options.resolveUrl(raw) : raw)
  const resolveImage = (raw: string) => safeImageUrl(options.resolveImageUrl ? options.resolveImageUrl(raw) : raw)

  // Inline formatting (safe because we escape input first).
  const renderInline = (unsafeText: string): string => {
    let html = escapeHtml(unsafeText)
    html = html.replace(/`([^`]+)`/g, '<code class="md__code">$1</code>')
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

    // Images before links (so `![alt](url)` isn't treated as a regular link).
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m: string, alt: string, rawUrl: string) => {
      const src = resolveImage(String(rawUrl))
      if (!src) return `<span class="md__img_placeholder">[image: ${alt || 'image'}]</span>`
      return `<img class="md__img" src="${src}" alt="${alt || 'image'}" loading="lazy" />`
    })

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m: string, text: string, rawUrl: string) => {
      return `<a class="link" href="${resolveLink(String(rawUrl))}" target="_blank" rel="noopener noreferrer">${String(text)}</a>`
    })
    return html
  }

  const blocks = parts.map((part, idx) => {
    const isCode = idx % 2 === 1
    if (isCode) {
      return `<pre class="md__pre"><code>${escapeHtml(part)}</code></pre>`
    }

    const lines = part.split('\n')
    const out: string[] = []
    let inList = false
    let inQuote = false

    const flushList = () => {
      if (!inList) return
      out.push('</ul>')
      inList = false
    }

    const flushQuote = () => {
      if (!inQuote) return
      out.push('</blockquote>')
      inQuote = false
    }

    for (const rawLine of lines) {
      const line = rawLine.replace(/\r/g, '')
      const heading = line.match(/^(#{1,6})\s+(.*)$/)
      if (heading) {
        flushList()
        flushQuote()
        const level = heading[1]?.length ?? 1
        out.push(`<h${level} class="md__h">${renderInline(heading[2] ?? '')}</h${level}>`)
        continue
      }

      const listItem = line.match(/^\s*[-*]\s+(.*)$/)
      if (listItem) {
        flushQuote()
        if (!inList) {
          out.push('<ul class="md__ul">')
          inList = true
        }
        out.push(`<li class="md__li">${renderInline(listItem[1] ?? '')}</li>`)
        continue
      }

      flushList()
      const quote = line.match(/^\s*>\s?(.*)$/)
      if (quote) {
        if (!inQuote) {
          out.push('<blockquote class="md__blockquote">')
          inQuote = true
        }
        const content = quote[1] ?? ''
        if (!content.trim()) {
          out.push('<div class="md__spacer"></div>')
        } else {
          out.push(`<p class="md__p">${renderInline(content)}</p>`)
        }
        continue
      }

      flushQuote()
      if (!line.trim()) {
        out.push('<div class="md__spacer"></div>')
        continue
      }

      out.push(`<p class="md__p">${renderInline(line)}</p>`)
    }
    flushList()
    flushQuote()
    return out.join('\n')
  })

  return blocks.join('\n')
}
