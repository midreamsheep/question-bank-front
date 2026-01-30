/**
 * @file Keep a CSS var in sync with the real sticky header height.
 *
 * The header can wrap (nav items) which changes its height; a hard-coded `top`
 * for sticky sidebars will then cause content to be covered by the header.
 */
import { onMounted, onUnmounted, type Ref } from 'vue'

export function useLayoutHeaderHeight(headerRef: Ref<HTMLElement | null>): void {
  let ro: ResizeObserver | null = null

  const update = (): void => {
    const el = headerRef.value
    if (!el) return
    const height = Math.ceil(el.getBoundingClientRect().height)
    document.documentElement.style.setProperty('--layout-header-height', `${height}px`)
  }

  onMounted(() => {
    update()
    ro = new ResizeObserver(() => update())
    if (headerRef.value) ro.observe(headerRef.value)
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    ro?.disconnect()
    ro = null
    window.removeEventListener('resize', update)
  })
}

