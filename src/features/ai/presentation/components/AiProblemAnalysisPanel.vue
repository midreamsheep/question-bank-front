<script setup lang="ts">
/**
 * @file AI analysis panel for problem detail page.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAiDi } from '../../di'
import type { AiProblemAnalysis, AiProblemAnalysisHighlights, AiProblemAnalysisStatus } from '../../domain/models'
import { renderMarkdown } from '../../../problem/presentation/utils/markdown'
import { runtimeConfig } from '../../../../infrastructure/config'

const props = defineProps<{
  problemId: string | null
}>()

const aiDi = useAiDi()

const loading = ref(false)
const errorMessage = ref('')
const data = ref<AiProblemAnalysis | null>(null)
const pollTimer = ref<number | null>(null)
const htmlRef = ref<HTMLElement | null>(null)

const status = computed<AiProblemAnalysisStatus | null>(() => data.value?.status ?? null)
const updatedAtLabel = computed(() => (data.value?.updatedAt ? String(data.value.updatedAt) : ''))

const analysisHtml = computed(() => {
  const source = data.value?.analysisMarkdown?.trim?.() ? String(data.value?.analysisMarkdown).trim() : ''
  if (!source) return ''
  return renderMarkdown(source, { resolveUrl: resolveContentUrl, resolveImageUrl: resolveContentUrl })
})

const highlights = computed<AiProblemAnalysisHighlights>(() => data.value?.highlights ?? {})

/**
 * Resolve a potentially-relative markdown link/image URL to an absolute URL.
 * @param rawUrl - Raw URL from markdown.
 * @returns Resolved URL.
 */
function resolveContentUrl(rawUrl: string): string {
  const trimmed = String(rawUrl).trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/')) {
    const base =
      runtimeConfig.apiBaseUrl.startsWith('http') ? runtimeConfig.apiBaseUrl : window.location.origin
    return new URL(trimmed, base).toString()
  }
  return trimmed
}

/**
 * Clear current polling timer.
 */
function clearPollTimer(): void {
  if (pollTimer.value !== null) {
    window.clearTimeout(pollTimer.value)
    pollTimer.value = null
  }
}

/**
 * Determine if status requires polling.
 * @param s - Current status.
 * @returns True if should poll.
 */
function shouldPoll(s: AiProblemAnalysisStatus | null): boolean {
  return s === 'PENDING' || s === 'RUNNING'
}

/**
 * Schedule a next poll with jitter.
 * @param fn - Poll function.
 */
function scheduleNextPoll(fn: () => void): void {
  clearPollTimer()
  const delayMs = 2000 + Math.floor(Math.random() * 3000)
  pollTimer.value = window.setTimeout(fn, delayMs)
}

/**
 * Trigger MathJax typesetting for this panel (best-effort).
 * @returns Promise resolved after typesetting.
 */
async function typesetPanelLatex(): Promise<void> {
  const mj = (window as unknown as { MathJax?: { typesetPromise?: (elements?: unknown[]) => Promise<void> } })
    .MathJax
  if (!mj?.typesetPromise) return
  if (!htmlRef.value) return
  try {
    await mj.typesetPromise([htmlRef.value])
  } catch {
    // Best-effort: invalid/incomplete LaTeX should not break the page.
  }
}

/**
 * Load AI analysis once, and continue polling until finished.
 * @param options - Load options.
 * @param options.silent - Skip global loading state (still updates data).
 * @returns Promise resolved after request completes.
 */
async function loadAnalysis(options: { silent?: boolean } = {}): Promise<void> {
  const id = props.problemId?.trim?.() ? String(props.problemId).trim() : ''
  if (!id) return

  if (!options.silent) {
    loading.value = true
    errorMessage.value = ''
  }

  try {
    const next = await aiDi.getProblemAnalysisUseCase.execute(id)
    data.value = next
    await nextTick()
    await typesetPanelLatex()

    if (shouldPoll(next.status)) {
      scheduleNextPoll(() => {
        void loadAnalysis({ silent: true })
      })
    } else {
      clearPollTimer()
    }
  } catch (error) {
    clearPollTimer()
    const message = error instanceof Error ? error.message : '加载 AI 解析失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

/**
 * Manual refresh handler.
 */
function handleRefresh(): void {
  void loadAnalysis()
}

onMounted(() => {
  void loadAnalysis()
})

onUnmounted(() => {
  clearPollTimer()
})

watch(
  () => props.problemId,
  () => {
    clearPollTimer()
    data.value = null
    errorMessage.value = ''
    void loadAnalysis()
  },
)
</script>

<template>
  <!-- Component: AI problem analysis panel -->
  <section class="card card--stack ai-panel">
    <header class="ai-panel__header">
      <div>
        <h2 class="card__title">AI 解析</h2>
        <p class="helper ai-panel__meta" v-if="updatedAtLabel">更新时间：{{ updatedAtLabel }}</p>
      </div>
      <button class="button button--ghost ai-panel__refresh" type="button" :disabled="loading" @click="handleRefresh">
        {{ loading ? '加载中...' : '刷新' }}
      </button>
    </header>

    <p v-if="!problemId" class="helper">题目ID无效。</p>
    <p v-else-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
    <template v-else-if="loading && !data">
      <p class="helper">加载中...</p>
    </template>
    <template v-else>
      <div class="ai-panel__statusRow" v-if="status">
        <span class="badge">状态：{{ status }}</span>
      </div>

      <div v-if="status === 'PENDING' || status === 'RUNNING'" class="helper">
        正在生成解析，请稍候…（自动轮询）
      </div>

      <template v-else-if="status === 'FAILED'">
        <p class="helper helper--error">{{ data?.errorMessage || '解析失败。' }}</p>
        <button class="button" type="button" :disabled="loading" @click="handleRefresh">稍后再试</button>
      </template>

      <template v-else-if="status === 'SUCCESS'">
        <div v-if="analysisHtml" ref="htmlRef" class="preview__content md ai-panel__markdown" v-html="analysisHtml"></div>
        <p v-else class="helper">暂无解析内容。</p>

        <div v-if="data?.stepByStep?.length" class="ai-panel__section">
          <h3 class="card__title ai-panel__sectionTitle">步骤思路</h3>
          <ol class="ai-panel__list">
            <li v-for="(step, idx) in data.stepByStep" :key="idx">{{ step }}</li>
          </ol>
        </div>

        <div v-if="highlights?.methodHints?.length" class="ai-panel__section">
          <h3 class="card__title ai-panel__sectionTitle">方法提示</h3>
          <ul class="ai-panel__list">
            <li v-for="(item, idx) in highlights.methodHints" :key="idx">{{ item }}</li>
          </ul>
        </div>

        <div v-if="highlights?.keyObservations?.length" class="ai-panel__section">
          <h3 class="card__title ai-panel__sectionTitle">关键观察</h3>
          <ul class="ai-panel__list">
            <li v-for="(item, idx) in highlights.keyObservations" :key="idx">{{ item }}</li>
          </ul>
        </div>

        <div v-if="highlights?.pitfalls?.length" class="ai-panel__section">
          <h3 class="card__title ai-panel__sectionTitle">易错点</h3>
          <ul class="ai-panel__list">
            <li v-for="(item, idx) in highlights.pitfalls" :key="idx">{{ item }}</li>
          </ul>
        </div>
      </template>
    </template>
  </section>
</template>
