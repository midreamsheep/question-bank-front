/**
 * @file Unit tests for markdown rendering.
 */
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders $$...$$ as a single block across multiple lines', () => {
    const html = renderMarkdown('$$\na=b+c\n$$')
    expect(html).toContain('<div class="md__math">$$\na=b+c\n$$</div>')
  })

  it('renders single-line $$...$$ as a math block', () => {
    const html = renderMarkdown('$$a=b$$')
    expect(html).toContain('<div class="md__math">$$a=b$$</div>')
  })

  it('does not parse $$ inside fenced code blocks', () => {
    const html = renderMarkdown('```\n$$\na\n$$\n```')
    expect(html).toContain('class="md__pre"')
    expect(html).toContain('$$')
    expect(html).not.toContain('class="md__math"')
  })

  it('does not create a math block when $$ is not closed', () => {
    const html = renderMarkdown('$$\na=b')
    expect(html).toContain('$$<br>')
    expect(html).toContain('a=b')
    expect(html).not.toContain('class="md__math"')
  })

  it('flushes list/quote before a math block', () => {
    const html = renderMarkdown('- item\n\n$$\na\n$$\n\n- item2')
    const listClose = html.indexOf('</ul>')
    const mathOpen = html.indexOf('<div class="md__math">')
    expect(listClose).toBeGreaterThan(-1)
    expect(mathOpen).toBeGreaterThan(listClose)
  })

  it('hardens unsafe links', () => {
    const html = renderMarkdown('[x](foo:bar)')
    expect(html).toContain('<a')
    expect(html).toContain('href="#"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('hardens unsafe images', () => {
    const html = renderMarkdown('![alt](foo:bar)')
    expect(html).toContain('md__img_placeholder')
  })

  it('supports tables (GFM-style)', () => {
    const html = renderMarkdown('|a|b|\n|---|---|\n|1|2|')
    expect(html).toContain('<table')
    expect(html).toContain('<thead>')
    expect(html).toContain('<tbody>')
  })
})
