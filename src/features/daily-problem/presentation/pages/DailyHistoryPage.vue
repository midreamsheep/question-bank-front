<script setup lang="ts">
/**
 * @file Daily history page: list daily problems by date.
 */
import { onMounted, ref } from 'vue'
import { useDailyProblemDi } from '../../di'
import type { DailyProblemSummary, PageResponse } from '../../domain/models'

const dailyProblemDi = useDailyProblemDi()

const loading = ref(false)
const errorMessage = ref('')
const result = ref<PageResponse<DailyProblemSummary> | null>(null)
const queryDay = ref('')
const dayResult = ref<DailyProblemSummary[] | null>(null)
const subjectLabels: Record<string, string> = {
  MATH: '数学',
  PHYSICS: '物理',
}

function formatSubject(value?: string): string {
  if (!value) return ''
  return subjectLabels[value] ?? value
}

/**
 * Format date as YYYY-MM-DD.
 * @param date date instance
 * @returns formatted date
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Load recent daily problems.
 */
async function loadHistory(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  const today = new Date()
  const fromDate = new Date(today)
  fromDate.setDate(today.getDate() - 30)
  try {
    result.value = await dailyProblemDi.listHistoryUseCase.execute({
      from: formatDate(fromDate),
      to: formatDate(today),
      page: 1,
      pageSize: 30,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载每日一题历史失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

/**
 * Load daily problem by day.
 */
async function loadByDay(): Promise<void> {
  if (!queryDay.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    dayResult.value = await dailyProblemDi.getByDayUseCase.execute(queryDay.value)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载每日一题失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadHistory()
})
</script>

<template>
  <section class="page">
    <header class="page__header">
      <h1 class="page__title">每日一题历史</h1>
    </header>
    <div class="card card--stack">
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-else-if="loading" class="helper">加载中...</p>
      <template v-else>
        <div class="filters">
          <label class="field">
            <span>按日期查询</span>
            <input v-model="queryDay" type="text" placeholder="YYYY-MM-DD" />
          </label>
          <button class="button button--ghost" :class="{ 'button--busy': loading }" :disabled="loading" @click="loadByDay">
            {{ loading ? '查询中...' : '查询' }}
          </button>
        </div>
        <div v-if="dayResult?.length" class="card card--stack">
          <p class="helper">日期：{{ queryDay }}</p>
          <ul class="list">
            <li v-for="item in dayResult" :key="item.id" class="list__item">
              <div>
                <strong>{{ item.problem.title }}</strong>
                <p class="helper">{{ item.copywriting || '暂无文案。' }}</p>
              </div>
              <router-link class="link" :to="`/problems/${item.problem.id}`">查看</router-link>
            </li>
          </ul>
        </div>
        <ul v-if="result?.items?.length" class="list">
          <li v-for="item in result.items" :key="item.id" class="list__item">
            <div>
              <strong>{{ item.day }}</strong>
              <p class="helper">{{ item.problem.title }} · {{ formatSubject(item.problem.subject) }}</p>
            </div>
            <router-link class="link" :to="`/problems/${item.problem.id}`">查看</router-link>
          </li>
        </ul>
        <p v-else class="helper">暂无每日一题。</p>
      </template>
    </div>
  </section>
</template>
