<script setup lang="ts">
/**
 * @file Daily problem page: infinite feed (scroll down to load older items).
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useDailyProblemDi } from '../../di'
import type { DailyProblemSummary } from '../../domain/models'

const dailyProblemDi = useDailyProblemDi()

const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const items = ref<DailyProblemSummary[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref<number | null>(null)
const hasMore = computed(() => (total.value === null ? true : items.value.length < total.value))
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

/**
 * Append items without duplicates.
 * @param next - Next items to append.
 */
function appendUnique(next: DailyProblemSummary[]): void {
  const seen = new Set(items.value.map((i) => i.id))
  const merged = [...items.value]
  for (const item of next) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    merged.push(item)
  }
  items.value = merged
}

/**
 * Load next history page and append to the feed.
 * @returns Promise resolved when loading completes.
 */
async function loadNextPage(): Promise<void> {
  if (loading.value || loadingMore.value) return
  if (!hasMore.value) return
  const isFirst = page.value === 1
  if (isFirst) loading.value = true
  else loadingMore.value = true
  errorMessage.value = ''
  try {
    const resp = await dailyProblemDi.listHistoryUseCase.execute({
      page: page.value,
      pageSize: pageSize.value,
    })
    total.value = resp.total
    appendUnique(resp.items)
    page.value += 1
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载每日一题失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const groups = computed(() => {
  const out: Array<{ day: string; items: DailyProblemSummary[] }> = []
  for (const item of items.value) {
    const last = out[out.length - 1]
    if (last && last.day === item.day) {
      last.items.push(item)
    } else {
      out.push({ day: item.day, items: [item] })
    }
  }
  return out
})

onMounted(() => {
  void loadNextPage()
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (!entry?.isIntersecting) return
      void loadNextPage()
    },
    { root: null, rootMargin: '300px 0px', threshold: 0.01 },
  )
  if (sentinelRef.value) observer.observe(sentinelRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <!-- Page: Daily problem -->
  <section class="page daily-feed">
    <header class="page__header">
      <h1 class="page__title">每日一题</h1>
      <p class="helper">向下滚动会自动加载更早的题。</p>
    </header>
    <!-- Feed: no outer heavy card; keep the page light on the paper background. -->
	    <div class="daily-feed__panel">
	      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
	      <p v-else-if="loading" class="helper">加载中...</p>
	      <template v-else>
	        <template v-if="items.length">
	          <!-- Daily groups: avoid nested heavy cards; keep a light separation. -->
	          <div v-for="group in groups" :key="group.day" class="daily-feed__group">
	            <div class="daily-feed__dayRow">
	              <h2 class="daily-feed__day">{{ group.day }}</h2>
	              <span class="daily-feed__count">{{ group.items.length }} 题</span>
	            </div>
	            <ul class="daily-entry__list">
	              <li v-for="item in group.items" :key="item.id" class="daily-entry__item">
	                <router-link class="daily-entry__link" :to="`/problems/${item.problem.id}`">
	                  <strong class="daily-entry__title">{{ item.problem.title }}</strong>
	                  <span class="daily-entry__sub">{{ item.copywriting || '暂无文案。' }}</span>
	                  <span class="daily-entry__chevron" aria-hidden="true">→</span>
	                </router-link>
	              </li>
	            </ul>
	          </div>
	          <div ref="sentinelRef" class="daily-feed__sentinel"></div>
	          <div class="daily-feed__footer">
	            <p v-if="loadingMore" class="helper">正在加载更多...</p>
	            <p v-else-if="!hasMore" class="helper">没有更多了。</p>
	            <button v-else class="button button--ghost" type="button" :disabled="loadingMore" @click="loadNextPage">
	              加载更多
	            </button>
	          </div>
	        </template>
	        <p v-else class="helper">暂无每日一题。</p>
	      </template>
	    </div>
  </section>
</template>
