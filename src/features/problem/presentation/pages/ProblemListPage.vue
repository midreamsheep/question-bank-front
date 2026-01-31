<script setup lang="ts">
/**
 * @file Problem list page: filtering and browsing problems.
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useProblemDi } from '../../di'
import { useTaxonomyDi } from '../../../taxonomy/di'
import type { PageResponse, ProblemListQuery, ProblemSummary } from '../../domain/models'
import type { Tag } from '../../../taxonomy/domain/models'
import SubjectCombobox from '../../../../infrastructure/components/SubjectCombobox.vue'

const problemDi = useProblemDi()
const taxonomyDi = useTaxonomyDi()

const keyword = ref('')
const subject = ref('')
const SUBJECT_SUGGESTIONS_KEY = 'vf.subjects.recent'
const subjectSuggestions = ref<string[]>(['MATH', 'PHYSICS'])
let subjectDebounceTimer = 0
const tagIds = ref<string[]>([])
const tagMenuOpen = ref(false)
const tagKeyword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const result = ref<PageResponse<ProblemSummary> | null>(null)
const tags = ref<Tag[]>([])

/**
 * Display-friendly subject label.
 * @param value - Subject enum value.
 * @returns Localized label.
 */
function formatSubject(value?: string): string {
  if (!value) return ''
  if (value === 'MATH') return '数学'
  if (value === 'PHYSICS') return '物理'
  return value
}

/**
 * Display-friendly author label.
 * @param author - Author object.
 * @returns Best-effort author display string.
 */
function formatAuthor(author?: ProblemSummary['author'] | null): string {
  if (!author) return '-'
  const displayName = author.displayName?.trim()
  if (displayName) return displayName
  const nickname = author.nickname?.trim()
  if (nickname) return nickname
  return author.id ? `用户 ${author.id}` : '-'
}

/**
 * Clear selected tag filters.
 */
function clearTagFilters(): void {
  tagIds.value = []
}

/**
 * Load recent subject suggestions from localStorage.
 */
function loadSubjectSuggestions(): void {
  try {
    const raw = localStorage.getItem(SUBJECT_SUGGESTIONS_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return
    const merged = [...subjectSuggestions.value]
    for (const item of parsed) {
      const s = String(item ?? '').trim()
      if (!s) continue
      if (merged.some((x) => x.toLowerCase() === s.toLowerCase())) continue
      merged.push(s)
    }
    subjectSuggestions.value = merged.slice(0, 20)
  } catch {
    // Ignore.
  }
}

/**
 * Save a subject into recent suggestions.
 * @param value - Subject string value.
 */
function rememberSubject(value: string): void {
  const cleaned = value.trim().slice(0, 64)
  if (!cleaned) return
  const merged = [cleaned, ...subjectSuggestions.value.filter((s) => s.toLowerCase() !== cleaned.toLowerCase())]
  subjectSuggestions.value = merged.slice(0, 20)
  try {
    localStorage.setItem(SUBJECT_SUGGESTIONS_KEY, JSON.stringify(subjectSuggestions.value))
  } catch {
    // Ignore.
  }
}

/**
 * Normalize subject input for querying.
 * @param value - Raw subject value.
 * @returns Normalized subject string.
 */
function normalizeSubject(value: string): string {
  return value.trim().slice(0, 64)
}

const selectedTagNames = computed(() => {
  const map = new Map(tags.value.map((t) => [String(t.id), t.name]))
  return tagIds.value
    .map((id) => map.get(id) ?? '')
    .filter((name) => name.trim().length > 0)
})

const selectedTags = computed(() => {
  const map = new Map(tags.value.map((t) => [String(t.id), t.name]))
  return tagIds.value
    .map((id) => ({ id, name: map.get(id) ?? '' }))
    .filter((t) => t.name.trim().length > 0)
})

const tagButtonLabel = computed(() => {
  if (!tagIds.value.length) return '全部'
  const names = selectedTagNames.value
  if (!names.length) return `${tagIds.value.length} 个标签`
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
})

const filteredTags = computed(() => {
  const kw = tagKeyword.value.trim().toLowerCase()
  if (!kw) return tags.value
  return tags.value.filter((t) => t.name.toLowerCase().includes(kw))
})

/**
 * Toggle tag dropdown menu.
 */
function toggleTagMenu(): void {
  tagMenuOpen.value = !tagMenuOpen.value
}

/**
 * Close tag dropdown menu.
 */
function closeTagMenu(): void {
  tagMenuOpen.value = false
}

/**
 * Close menu when clicking outside the tag filter container.
 * @param event - Document click event.
 */
function onDocumentClick(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (target.closest('.tag-filter') === null) closeTagMenu()
}

/**
 * Handle global keydown interactions.
 * @param event - Keyboard event.
 */
function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') closeTagMenu()
}

/**
 * Fetch problem list with current filters.
 */
async function loadProblems(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  const query: ProblemListQuery = {
    page: 1,
    pageSize: 12,
    keyword: keyword.value.trim() || undefined,
    subject: normalizeSubject(subject.value) || undefined,
    tagIds: tagIds.value.length ? tagIds.value.map((id) => Number(id)).filter(Number.isFinite) : undefined,
  }

  try {
    result.value = await problemDi.listUseCase.execute(query)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载题目失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

/**
 * Load taxonomy filters for problem list.
 */
async function loadTaxonomy(): Promise<void> {
  try {
    const cleanedSubject = normalizeSubject(subject.value)
    tags.value = await taxonomyDi.listTagsUseCase.execute(cleanedSubject ? { subject: cleanedSubject } : undefined)
  } catch {
    // Keep taxonomy optional; do not block list if taxonomy fails.
  }
}

onMounted(() => {
  loadSubjectSuggestions()
  void loadProblems()
  void loadTaxonomy()
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeyDown)
  if (subjectDebounceTimer) window.clearTimeout(subjectDebounceTimer)
})

watch(subject, () => {
  tagIds.value = []
  tagKeyword.value = ''
  tagMenuOpen.value = false
  if (subjectDebounceTimer) window.clearTimeout(subjectDebounceTimer)
  subjectDebounceTimer = window.setTimeout(() => {
    void loadTaxonomy()
  }, 300)
})
</script>

<template>
  <!-- Page: Problem list -->
  <section class="page problem-list">
    <header class="page__header">
      <h1 class="page__title">题库</h1>
    </header>
    <div class="card card--stack problem-list__panel">
      <!-- Filters: compact toolbar -->
      <div class="problem-list__filters">
        <label class="field problem-list__field">
          <span class="sr-only">学科</span>
          <SubjectCombobox
            v-model="subject"
            :options="subjectSuggestions"
            placeholder="全部 / 点击输入筛选学科"
            :max-length="64"
            :allow-empty="true"
            @blur="(v) => rememberSubject(v)"
          />
        </label>
        <label class="field problem-list__field">
          <span class="sr-only">标签</span>
          <div class="tag-filter">
            <button class="select-like" type="button" @click="toggleTagMenu">
              <span class="select-like__value">{{ tagButtonLabel }}</span>
              <span class="select-like__chevron" aria-hidden="true">▾</span>
            </button>

            <div v-if="tagMenuOpen" class="tag-filter__menu" role="menu">
              <div class="tag-filter__header">
                <input v-model="tagKeyword" class="tag-filter__search" type="text" placeholder="搜索标签" />
                <button
                  class="button button--ghost"
                  type="button"
                  :disabled="!tagIds.length"
                  @click="clearTagFilters"
                >
                  清空
                </button>
                <button class="button" type="button" @click="closeTagMenu">完成</button>
              </div>

              <div v-if="selectedTags.length" class="tag-filter__selected">
                <span class="helper">已选：</span>
                <div class="tag-filter__selectedList">
                  <span v-for="t in selectedTags" :key="t.id" class="tag-pill">{{ t.name }}</span>
                </div>
              </div>

              <div class="tag-filter__list">
                <label v-for="item in filteredTags" :key="item.id" class="tag-filter__item">
                  <input v-model="tagIds" type="checkbox" :value="String(item.id)" />
                  <span>{{ item.name }}</span>
                </label>
                <p v-if="!filteredTags.length" class="helper">没有匹配的标签。</p>
              </div>
            </div>
          </div>
        </label>
        <label class="field problem-list__field problem-list__field--keyword">
          <span class="sr-only">关键词</span>
          <input v-model="keyword" type="text" placeholder="搜索标题 / 作者" @keydown.enter="loadProblems" />
        </label>
        <button
          class="button problem-list__search"
          :class="{ 'button--busy': loading }"
          :disabled="loading"
          @click="loadProblems"
        >
          {{ loading ? '搜索中...' : '搜索' }}
        </button>
      </div>

      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-else-if="loading" class="helper">加载中...</p>
      <template v-else>
        <!-- Results: dense list items (single-click open) -->
        <ul v-if="result?.items?.length" class="problem-list__list">
          <li v-for="item in result.items" :key="item.id" class="problem-list__item">
            <router-link class="problem-list__link" :to="`/problems/${item.id}`">
              <div class="problem-list__titleRow">
                <strong class="problem-list__title">{{ item.title }}</strong>
                <span class="problem-list__meta">
                  <span class="problem-list__chip">{{ formatSubject(item.subject) }}</span>
                  <span class="problem-list__chip problem-list__chip--muted">难度 {{ item.difficulty }}</span>
                </span>
              </div>
              <span class="problem-list__byline">作者：{{ formatAuthor(item.author) }}</span>
            </router-link>
          </li>
        </ul>
        <p v-else class="helper">暂无题目。</p>
      </template>
    </div>
  </section>
</template>
