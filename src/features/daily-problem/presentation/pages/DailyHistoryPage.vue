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

/**
 * Format a subject code for display.
 * @param value subject code
 * @returns display label
 */
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
  <!-- Page: Daily problem history -->
  <section class="page daily-history">
    <header class="page__header">
      <h1 class="page__title">每日一题历史</h1>
    </header>
    <div class="card card--stack daily-history__panel">
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-else-if="loading" class="helper">加载中...</p>
	      <template v-else>
	        <div class="filters">
	          <label class="field">
	            <span>按日期查询</span>
	            <input v-model="queryDay" type="text" placeholder="YYYY-MM-DD" @keydown.enter="loadByDay" />
	          </label>
	          <button class="button button--ghost" :class="{ 'button--busy': loading }" :disabled="loading" @click="loadByDay">
	            {{ loading ? '查询中...' : '查询' }}
	          </button>
	        </div>
	        <!-- Query results: light group container (avoid nested heavy card shadows). -->
	        <div v-if="dayResult?.length" class="daily-history__group">
	          <p class="daily-history__day">日期：{{ queryDay }}</p>
	          <ul class="daily-entry__list">
	            <li v-for="item in dayResult" :key="item.id" class="daily-entry__item">
	              <router-link class="daily-entry__link" :to="`/problems/${item.problem.id}`">
	                <strong class="daily-entry__title">{{ item.problem.title }}</strong>
	                <span class="daily-entry__sub">{{ item.copywriting || '暂无文案。' }}</span>
	                <span class="daily-entry__chevron" aria-hidden="true">→</span>
	              </router-link>
	            </li>
	          </ul>
	        </div>
	        <ul v-if="result?.items?.length" class="daily-entry__list">
	          <li v-for="item in result.items" :key="item.id" class="daily-entry__item">
	            <router-link class="daily-entry__link" :to="`/problems/${item.problem.id}`">
	              <strong class="daily-entry__title">{{ item.day }}</strong>
	              <span class="daily-entry__sub">{{ item.problem.title }} · {{ formatSubject(item.problem.subject) }}</span>
	              <span class="daily-entry__chevron" aria-hidden="true">→</span>
	            </router-link>
	          </li>
	        </ul>
	        <p v-else class="helper">暂无每日一题。</p>
	      </template>
	    </div>
	  </section>
</template>
