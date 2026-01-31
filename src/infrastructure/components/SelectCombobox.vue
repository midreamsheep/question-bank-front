<script setup lang="ts">
/**
 * @file Select-only combobox: input-like control that opens a dropdown list of fixed options.
 *
 * Notes:
 * - Read-only (no free typing) to avoid invalid values for enum-like fields.
 * - Styled to match SubjectCombobox visual language.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'

type OptionItem = { value: string; label: string; hint?: string }

const props = defineProps<{
  modelValue: string
  options: OptionItem[]
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)

const selectedLabel = computed(() => {
  const found = props.options.find((o) => o.value === props.modelValue)
  if (found) return found.label
  if (props.modelValue.trim()) return props.modelValue
  return props.placeholder ?? '请选择'
})

/**
 * Toggle dropdown open state (chevron only).
 */
function toggle(): void {
  if (props.disabled) return
  open.value = !open.value
}

/**
 * Close dropdown menu.
 */
function close(): void {
  open.value = false
}

/**
 * Handle input focus (no-op; opening is driven by click/keyboard).
 */
function onFocus(): void {
  // Intentionally empty: prevents "focus open + click toggle" from immediately closing.
}

/**
 * Close menu on blur (async) to allow menu clicks.
 */
function onBlur(): void {
  window.setTimeout(() => close(), 0)
}

/**
 * Open menu for keyboard users.
 * @param event - Keyboard event.
 */
function onInputKeyDown(event: KeyboardEvent): void {
  if (props.disabled) return
  if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
    event.preventDefault()
    open.value = true
  }
}

/**
 * Set modelValue from an option and close.
 * @param next - Selected option value.
 */
function select(next: string): void {
  if (props.disabled) return
  emit('update:modelValue', next)
  close()
}

/**
 * Close menu when clicking outside component root.
 * @param event - Document click event.
 */
function onDocumentClick(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  const root = rootRef.value
  if (!root) return
  if (!root.contains(target)) close()
}

/**
 * Close menu on Escape key.
 * @param event - Keyboard event.
 */
function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <!-- Component: select-only combobox (read-only input + options menu) -->
  <div ref="rootRef" class="subject-combo subject-combo--locked">
    <div class="subject-combo__control">
      <input
        class="subject-combo__input"
        :value="selectedLabel"
        :placeholder="placeholder ?? '请选择'"
        :disabled="disabled"
        readonly
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onInputKeyDown"
        @click="toggle"
      />
      <button
        class="subject-combo__chevron"
        type="button"
        aria-label="toggle"
        :disabled="disabled"
        @mousedown.prevent
        @click="toggle"
      >
        ▾
      </button>
    </div>

    <div v-if="open" class="subject-combo__menu" role="listbox">
      <button
        v-for="item in options"
        :key="item.value || item.label"
        class="subject-combo__item"
        type="button"
        @mousedown.prevent
        @click="select(item.value)"
      >
        <span class="subject-combo__value">{{ item.label }}</span>
        <span v-if="item.hint" class="subject-combo__hint">{{ item.hint }}</span>
      </button>
      <p v-if="!options.length" class="helper">没有可选项。</p>
    </div>
  </div>
</template>
