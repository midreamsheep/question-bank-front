<script setup lang="ts">
/**
 * @file Mobile navigation drawer (overlay + slide-in).
 */
import { onUnmounted, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

/**
 * Close the drawer.
 */
function close(): void {
  emit('update:open', false)
}

/**
 * Close on Escape key.
 * @param event - Keyboard event.
 */
function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

let prevOverflow = ''
watch(
  () => props.open,
  (open) => {
    if (open) {
      prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', onKeyDown)
    } else {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  document.body.style.overflow = prevOverflow
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <!-- Mobile navigation drawer: overlay + slide-in panel -->
  <Teleport to="body">
    <div v-if="open" class="layout__drawerOverlay" @click.self="close" role="presentation">
      <aside class="layout__drawer" role="dialog" aria-modal="true" :aria-label="title">
        <header class="layout__drawerHeader">
          <div class="layout__drawerTitle">{{ title }}</div>
          <button class="layout__drawerClose" type="button" aria-label="关闭菜单" @click="close">×</button>
        </header>
        <nav class="layout__drawerNav">
          <slot :close="close" />
        </nav>
      </aside>
    </div>
  </Teleport>
</template>
