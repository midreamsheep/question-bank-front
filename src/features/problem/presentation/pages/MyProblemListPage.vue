<script setup lang="ts">
/**
 * @file My problems page: manage drafts, reviews, and published problems.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProblemDi } from '../../di'
import type { PageResponse, ProblemStatus, ProblemSummary, Visibility } from '../../domain/models'

const problemDi = useProblemDi()
const router = useRouter()

type TabKey = 'ALL' | ProblemStatus

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'ALL', label: '全部' },
  { key: 'DRAFT', label: '草稿' },
  { key: 'PUBLISHED', label: '已发布' },
  { key: 'DISABLED', label: '已下架' },
]

const statusLabels: Record<ProblemStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  DISABLED: '已下架',
}

/**
 * Display-friendly subject label.
 * @param value - Subject enum value.
 * @returns Localized label.
 */
function formatSubject(value: string): string {
  if (value === 'MATH') return '数学'
  if (value === 'PHYSICS') return '物理'
  return value
}

const visibilityLabels: Record<Visibility, string> = {
  PUBLIC: '公开',
  UNLISTED: '不公开列出',
  PRIVATE: '私有',
}

const activeTab = ref<TabKey>('ALL')
const page = ref(1)
const pageSize = ref(12)

const loading = ref(false)
const errorMessage = ref('')
const result = ref<PageResponse<ProblemSummary> | null>(null)
const rowBusy = ref<{ id: string; action: 'publish' | 'disable' | 'delete' } | null>(null)

const totalPages = computed(() => {
  const total = result.value?.total ?? 0
  return total > 0 ? Math.ceil(total / pageSize.value) : 1
})

const canPrev = computed(() => page.value > 1)
const canNext = computed(() => page.value < totalPages.value)

/**
 * Load current page data based on tab + paging state.
 * @returns Promise resolved when data is loaded.
 */
async function load(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    result.value = await problemDi.listMineUseCase.execute({
      status: activeTab.value === 'ALL' ? undefined : activeTab.value,
      page: page.value,
      pageSize: pageSize.value,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载题目失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

/**
 * Switch list status filter tab.
 * @param key - Target tab key.
 */
function handleSwitchTab(key: TabKey): void {
  activeTab.value = key
  page.value = 1
}

/**
 * Navigate to the problem creation page.
 */
function handleCreate(): void {
  void router.push('/me/problems/new')
}

/**
 * Determine whether the current user can edit a given summary row.
 * @param item - Problem summary item.
 * @returns True if editable.
 */
function canEdit(item: ProblemSummary): boolean {
  return item.status === 'DRAFT' || item.status === 'PUBLISHED' || item.status === 'DISABLED'
}

/**
 * Delete a draft problem (confirmed).
 * @param item - Problem summary item.
 * @returns Promise resolved when deletion finishes.
 */
async function handleDelete(item: ProblemSummary): Promise<void> {
  if (item.status !== 'DRAFT') return
  const ok = window.confirm('确定删除该草稿吗？此操作不可恢复。')
  if (!ok) return
  rowBusy.value = { id: item.id, action: 'delete' }
  errorMessage.value = ''
  try {
    await problemDi.deleteUseCase.execute(item.id)
    await load()
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除失败。'
    errorMessage.value = message
  } finally {
    if (rowBusy.value?.id === item.id && rowBusy.value.action === 'delete') rowBusy.value = null
  }
}

/**
 * Publish a draft problem or re-publish a disabled problem.
 * @param item - Problem summary item.
 * @returns Promise resolved when publish finishes.
 */
async function handlePublish(item: ProblemSummary): Promise<void> {
  // Backend semantics: author can publish from DRAFT or re-publish from DISABLED.
  if (item.status !== 'DRAFT' && item.status !== 'DISABLED') return
  rowBusy.value = { id: item.id, action: 'publish' }
  errorMessage.value = ''
  try {
    await problemDi.publishUseCase.execute(item.id)
    await load()
  } catch (error) {
    const message = error instanceof Error ? error.message : '发布失败。'
    errorMessage.value = message
  } finally {
    if (rowBusy.value?.id === item.id && rowBusy.value.action === 'publish') rowBusy.value = null
  }
}

/**
 * Disable (take down) a published problem (confirmed).
 * @param item - Problem summary item.
 * @returns Promise resolved when disabling finishes.
 */
async function handleDisable(item: ProblemSummary): Promise<void> {
  if (item.status !== 'PUBLISHED') return
  const ok = window.confirm('确定下架该题目吗？下架后将变为“已下架”。')
  if (!ok) return
  rowBusy.value = { id: item.id, action: 'disable' }
  errorMessage.value = ''
  try {
    await problemDi.disableUseCase.execute(item.id)
    await load()
  } catch (error) {
    const message = error instanceof Error ? error.message : '下架失败。'
    errorMessage.value = message
  } finally {
    if (rowBusy.value?.id === item.id && rowBusy.value.action === 'disable') rowBusy.value = null
  }
}

/**
 * Navigate to editor page for a given problem.
 * @param item - Problem summary item.
 */
function handleEdit(item: ProblemSummary): void {
  if (!canEdit(item)) return
  void router.push(`/me/problems/${item.id}/edit`)
}

/**
 * Navigate to previous page in pagination.
 */
function handlePrev(): void {
  if (!canPrev.value) return
  page.value -= 1
}

/**
 * Navigate to next page in pagination.
 */
function handleNext(): void {
  if (!canNext.value) return
  page.value += 1
}

watch([activeTab, page], () => {
  void load()
})

onMounted(() => {
  void load()
})
</script>

<template>
  <!-- Page: My problems -->
  <section class="page">
    <header class="page__header">
      <h1 class="page__title">我的题目</h1>
    </header>
    <div class="card card--stack">
      <div class="actions">
        <button class="button" type="button" @click="handleCreate">新建题目</button>
      </div>

      <div class="actions">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="button button--ghost"
          type="button"
          :disabled="activeTab === tab.key"
          @click="handleSwitchTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-else-if="loading" class="helper">加载中...</p>
      <template v-else>
        <p class="helper">
          共 {{ result?.total ?? 0 }} 条，当前第 {{ result?.page ?? 1 }} 页 / {{ totalPages }} 页
        </p>

        <ul v-if="result?.items?.length" class="list">
          <li v-for="item in result.items" :key="item.id" class="list__item">
            <div>
              <strong>{{ item.title }}</strong>
              <p class="helper">
                {{ formatSubject(item.subject) }} · 难度 {{ item.difficulty }} ·
                {{ visibilityLabels[item.visibility] ?? item.visibility }} ·
                {{ statusLabels[item.status] ?? item.status }} ·
                作者：{{
                  item.author?.displayName ||
                  item.author?.nickname ||
                  (item.author?.id ? `用户 ${item.author.id}` : '-')
                }} ·
                发布：{{ item.status === 'PUBLISHED' ? (item.publishedAt ?? '-') : '-' }}
              </p>
            </div>
            <div class="actions">
              <button
                class="button button--ghost"
                type="button"
                :disabled="!canEdit(item) || rowBusy?.id === item.id"
                @click="handleEdit(item)"
              >
                编辑
              </button>
              <button
                class="button button--ghost"
                type="button"
                :class="{ 'button--busy': rowBusy?.id === item.id && rowBusy?.action === 'publish' }"
                :disabled="(item.status !== 'DRAFT' && item.status !== 'DISABLED') || rowBusy?.id === item.id"
                @click="handlePublish(item)"
              >
                {{
                  rowBusy?.id === item.id && rowBusy?.action === 'publish'
                    ? '发布中...'
                    : (item.status === 'DISABLED' ? '重新发布' : '发布')
                }}
              </button>
              <button
                class="button button--ghost"
                type="button"
                :class="{ 'button--busy': rowBusy?.id === item.id && rowBusy?.action === 'disable' }"
                :disabled="item.status !== 'PUBLISHED' || rowBusy?.id === item.id"
                @click="handleDisable(item)"
              >
                {{ rowBusy?.id === item.id && rowBusy?.action === 'disable' ? '下架中...' : '下架' }}
              </button>
              <button
                class="button button--ghost"
                type="button"
                :class="{ 'button--busy': rowBusy?.id === item.id && rowBusy?.action === 'delete' }"
                :disabled="item.status !== 'DRAFT' || rowBusy?.id === item.id"
                @click="handleDelete(item)"
              >
                {{ rowBusy?.id === item.id && rowBusy?.action === 'delete' ? '删除中...' : '删除' }}
              </button>
            </div>
          </li>
        </ul>
        <p v-else class="helper">暂无题目。</p>

        <div class="actions">
          <button class="button button--ghost" type="button" :disabled="!canPrev" @click="handlePrev">上一页</button>
          <button class="button button--ghost" type="button" :disabled="!canNext" @click="handleNext">下一页</button>
        </div>
      </template>
    </div>
  </section>
</template>
