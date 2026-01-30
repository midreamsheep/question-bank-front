<script setup lang="ts">
/**
 * @file Problem share page: shareKey access for unlisted problems.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProblemDi } from '../../di'
import type { ProblemDetail } from '../../domain/models'

const problemDi = useProblemDi()
const route = useRoute()

const loading = ref(false)
const errorMessage = ref('')
const detail = ref<ProblemDetail | null>(null)

const shareKey = computed(() => String(route.params.shareKey || ''))

/**
 * Load problem detail by share key.
 */
async function loadProblem(): Promise<void> {
  if (!shareKey.value) {
    errorMessage.value = '分享码无效。'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    detail.value = await problemDi.getByShareKeyUseCase.execute(shareKey.value)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载分享题目失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadProblem()
})

watch(shareKey, () => {
  void loadProblem()
})
</script>

<template>
  <section class="page">
    <header class="page__header">
      <h1 class="page__title">{{ detail?.title ?? '分享题目' }}</h1>
    </header>
    <div class="card card--stack">
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-else-if="loading" class="helper">加载中...</p>
      <template v-else>
        <div>
          <h2 class="card__title">题目描述</h2>
          <p class="card__text">{{ detail?.statement }}</p>
        </div>
        <div>
          <h2 class="card__title">解答</h2>
          <p class="card__text">{{ detail?.solution ?? '暂无解答。' }}</p>
        </div>
      </template>
    </div>
  </section>
</template>
