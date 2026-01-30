/**
 * @file Load MathJax at runtime with CDN fallbacks.
 *
 * Some environments (corp networks, regions) block specific CDNs. We keep the
 * app usable even when MathJax can't be loaded: pages will show raw TeX.
 */

type MathJaxWindow = Window & {
  MathJax?: {
    startup?: { promise?: Promise<unknown> }
    typesetPromise?: (elements?: unknown[]) => Promise<unknown>
    tex?: unknown
    svg?: unknown
  }
}

function getMathJaxUrls(): string[] {
  const raw = (import.meta.env.VITE_MATHJAX_URLS as string | undefined) ?? ''
  const urls = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (urls.length) return urls

  // Defaults: try multiple CDNs.
  return [
    'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js',
    'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.js',
    'https://unpkg.com/mathjax@3/es5/tex-svg.js',
  ]
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = 'mathjax-script'
    script.async = true
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load MathJax from ${src}`))
    document.head.appendChild(script)
  })
}

async function waitReady(): Promise<void> {
  const mj = (window as MathJaxWindow).MathJax
  const startup = mj?.startup?.promise
  if (startup) {
    try {
      await startup
    } catch {
      // Ignore; callers will rely on typesetPromise existence anyway.
    }
  }
}

/**
 * Ensure MathJax is available; otherwise keep silent (raw TeX is still shown).
 */
export async function ensureMathJaxLoaded(): Promise<void> {
  const w = window as MathJaxWindow
  if (w.MathJax?.typesetPromise) return

  // If a script already exists (e.g. injected by HTML), wait a bit.
  const existing = document.getElementById('mathjax-script') as HTMLScriptElement | null
  if (existing) {
    // Give it a chance to finish.
    for (let i = 0; i < 10; i += 1) {
      if (w.MathJax?.typesetPromise) return
      await new Promise((r) => window.setTimeout(r, 200))
    }
    return
  }

  for (const url of getMathJaxUrls()) {
    try {
      await loadScript(url)
      await waitReady()
      if (w.MathJax?.typesetPromise) return
    } catch {
      // Try next CDN.
      const node = document.getElementById('mathjax-script')
      node?.parentNode?.removeChild(node)
    }
  }
}

