<script setup lang="ts">
/**
 * @file Subject combobox: single input that filters dropdown options and writes back selected value.
 *
 * Requirements (from product):
 * - Only ONE box (not input + select).
 * - Clicking allows typing; typed text filters dropdown options.
 * - Clicking an option sets the input value to that option.
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  options: string[]
  placeholder?: string
  maxLength?: number
  allowEmpty?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur', value: string): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const open = ref(false)
const draft = ref(props.modelValue)

function normalize(value: string): string {
  const max = props.maxLength ?? 64
  return value.trim().slice(0, max)
}

const filtered = computed(() => {
  const q = draft.value.trim().toLowerCase()
  const base = props.options.filter(Boolean)
  const uniq: string[] = []
  for (const item of base) {
    const v = String(item).trim()
    if (!v) continue
    if (uniq.some((x) => x.toLowerCase() === v.toLowerCase())) continue
    uniq.push(v)
  }
  if (!q) return uniq
  return uniq.filter((v) => v.toLowerCase().includes(q))
})

function setValue(value: string): void {
  emit('update:modelValue', normalize(value))
}

function toggle(): void {
  open.value = !open.value
  if (open.value) {
    draft.value = props.modelValue
    // Ensure keyboard typing works after clicking the chevron.
    queueMicrotask(() => inputRef.value?.focus())
  }
}

function close(): void {
  open.value = false
}

function onFocus(): void {
  open.value = true
  draft.value = props.modelValue
}

function onBlur(): void {
  const v = normalize(draft.value)
  setValue(v)
  emit('blur', v)
  // Let clicks inside the menu register before closing.
  window.setTimeout(() => close(), 0)
}

function onDocumentClick(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (target.closest('.subject-combo') === null) close()
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

function displayHint(value: string): string {
  if (value === 'MATH') return '数学'
  if (value === 'PHYSICS') return '物理'
  return ''
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeyDown)
})

watch(
  () => props.modelValue,
  (next) => {
    if (!open.value) draft.value = next
  },
)
</script>

<template>
  <div class="subject-combo">
    <div class="subject-combo__control">
      <input
        ref="inputRef"
        class="subject-combo__input"
        :value="draft"
        :maxlength="maxLength ?? 64"
        :placeholder="placeholder"
        @input="draft = ($event.target as HTMLInputElement).value"
        @focus="onFocus"
        @blur="onBlur"
      />
      <button class="subject-combo__chevron" type="button" aria-label="toggle" @click="toggle">▾</button>
    </div>

    <div v-if="open" class="subject-combo__menu" role="listbox">
      <button
        v-if="allowEmpty"
        class="subject-combo__item"
        type="button"
        @mousedown.prevent
        @click="setValue(''); draft = ''; close()"
      >
        <span class="subject-combo__value">全部</span>
      </button>
      <button
        v-for="item in filtered"
        :key="item"
        class="subject-combo__item"
        type="button"
        @mousedown.prevent
        @click="setValue(item); draft = item; close()"
      >
        <span class="subject-combo__value">{{ item }}</span>
        <span v-if="displayHint(item)" class="subject-combo__hint">{{ displayHint(item) }}</span>
      </button>
      <p v-if="!filtered.length && !allowEmpty" class="helper">没有匹配项。</p>
    </div>
  </div>
</template>
