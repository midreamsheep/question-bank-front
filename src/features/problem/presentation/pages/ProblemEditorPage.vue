<script setup lang="ts">
/**
 * @file Problem editor page: create or edit a problem draft.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProblemDi } from '../../di'
import { useFileDi } from '../../../file/di'
import type { ProblemDetail, ProblemPayload } from '../../domain/models'
import { useTaxonomyDi } from '../../../taxonomy/di'
import type { Tag } from '../../../taxonomy/domain/models'
import SubjectCombobox from '../../../../infrastructure/components/SubjectCombobox.vue'
import { useCollectionDi } from '../../../collection/di'
import type { CollectionSummary, PageResponse as CollectionPageResponse } from '../../../collection/domain/models'
import { useAdminDi } from '../../../admin/di'
import { HttpError } from '../../../../infrastructure/http'
import { runtimeConfig } from '../../../../infrastructure/config'
import { escapeHtml, renderMarkdown } from '../utils/markdown'

const problemDi = useProblemDi()
const fileDi = useFileDi()
const taxonomyDi = useTaxonomyDi()
const collectionDi = useCollectionDi()
const adminDi = useAdminDi()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const busyAction = ref<'' | 'save' | 'publish' | 'disable' | 'delete' | 'addToCollection' | 'publishDaily'>('')
const currentStatus = ref<'DRAFT' | 'PUBLISHED' | 'DISABLED' | ''>('')
const currentShareKey = ref('')
const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  DISABLED: '已下架',
}

const title = ref('')
const subject = ref('MATH')
const suspendSubjectReset = ref(false)
const difficulty = ref(3)
const statementFormat = ref<'MARKDOWN' | 'LATEX'>('MARKDOWN')
const statement = ref('')
const solutionFormat = ref<'MARKDOWN' | 'LATEX' | ''>('')
const solution = ref('')
// Drafts are typically private; also avoids backend implementations that deny fetching "PUBLIC + DRAFT".
const visibility = ref<'PUBLIC' | 'UNLISTED' | 'PRIVATE'>('PRIVATE')

const uploadedItems = ref<Array<{ fileId: string; shareUrl: string }>>([])

const tags = ref<Tag[]>([])
const tagIds = ref<number[]>([])
const tagMenuOpen = ref(false)
const tagKeyword = ref('')
const newTagName = ref('')
const pendingNewTags = ref<string[]>([])

const SUBJECT_SUGGESTIONS_KEY = 'vf.subjects.recent'
const subjectSuggestions = ref<string[]>(['MATH', 'PHYSICS'])
let subjectDebounceTimer = 0

function normalizeSubject(value: string): string {
  return value.trim().slice(0, 64)
}

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
    // Ignore storage issues.
  }
}

function rememberSubject(value: string): void {
  const cleaned = normalizeSubject(value)
  if (!cleaned) return
  const merged = [cleaned, ...subjectSuggestions.value.filter((s) => s.toLowerCase() !== cleaned.toLowerCase())]
  subjectSuggestions.value = merged.slice(0, 20)
  try {
    localStorage.setItem(SUBJECT_SUGGESTIONS_KEY, JSON.stringify(subjectSuggestions.value))
  } catch {
    // Ignore storage issues.
  }
}

const selectedTags = computed(() => {
  const map = new Map(tags.value.map((t) => [t.id, t.name]))
  return tagIds.value
    .map((id) => ({ id, name: map.get(id) ?? '' }))
    .filter((t) => t.name.trim().length > 0)
})

const tagButtonLabel = computed(() => {
  const names = [...selectedTags.value.map((t) => t.name), ...pendingNewTags.value]
  if (!names.length) return '全部'
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
})

const filteredTags = computed(() => {
  const kw = tagKeyword.value.trim().toLowerCase()
  if (!kw) return tags.value
  return tags.value.filter((t) => t.name.toLowerCase().includes(kw))
})

function toggleTagMenu(): void {
  tagMenuOpen.value = !tagMenuOpen.value
}

function closeTagMenu(): void {
  tagMenuOpen.value = false
}

function clearTagFilters(): void {
  tagIds.value = []
  pendingNewTags.value = []
}

function addPendingTag(): void {
  const name = newTagName.value.trim()
  if (!name) return
  // Avoid duplicate tag names (case-insensitive).
  const existsSelected = selectedTags.value.some((t) => t.name.toLowerCase() === name.toLowerCase())
  const existsPending = pendingNewTags.value.some((t) => t.toLowerCase() === name.toLowerCase())
  if (existsSelected || existsPending) {
    newTagName.value = ''
    return
  }
  pendingNewTags.value = [...pendingNewTags.value, name]
  newTagName.value = ''
}

function removePendingTag(name: string): void {
  pendingNewTags.value = pendingNewTags.value.filter((t) => t !== name)
}

function onDocumentClick(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (target.closest('.tag-filter') === null) closeTagMenu()
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') closeTagMenu()
}

const statementPreviewRef = ref<HTMLElement | null>(null)
const solutionPreviewRef = ref<HTMLElement | null>(null)
const statementMdPreviewRef = ref<HTMLElement | null>(null)
const solutionMdPreviewRef = ref<HTMLElement | null>(null)
const statementTextareaRef = ref<HTMLTextAreaElement | null>(null)
const solutionTextareaRef = ref<HTMLTextAreaElement | null>(null)
const previewAsideRef = ref<HTMLElement | null>(null)

const activeEditor = ref<'statement' | 'solution'>('statement')
const followPreviewScroll = ref(true)
let previewSyncRaf = 0

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

function getTextarea(kind: 'statement' | 'solution'): HTMLTextAreaElement | null {
  return kind === 'statement' ? statementTextareaRef.value : solutionTextareaRef.value
}

function getPreviewElement(kind: 'statement' | 'solution'): HTMLElement | null {
  if (kind === 'statement') {
    return statementFormat.value === 'LATEX' ? statementPreviewRef.value : statementMdPreviewRef.value
  }
  return solutionFormat.value === 'LATEX' ? solutionPreviewRef.value : solutionMdPreviewRef.value
}

function computeScrollRatio(el: HTMLElement): number {
  const max = el.scrollHeight - el.clientHeight
  if (max <= 0) return 0
  return clamp01(el.scrollTop / max)
}

function scrollPreviewToRatio(kind: 'statement' | 'solution', ratio: number): void {
  const container = previewAsideRef.value
  const target = getPreviewElement(kind)
  if (!container || !target) return

  const containerRect = container.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const targetTopInContainer = container.scrollTop + (targetRect.top - containerRect.top)
  const targetPoint = targetTopInContainer + clamp01(ratio) * Math.max(0, target.scrollHeight)
  const desired = targetPoint - container.clientHeight * 0.25
  const max = container.scrollHeight - container.clientHeight
  container.scrollTop = Math.max(0, Math.min(max, desired))
}

function schedulePreviewSync(kind: 'statement' | 'solution'): void {
  if (!followPreviewScroll.value) return
  if (previewSyncRaf) window.cancelAnimationFrame(previewSyncRaf)
  previewSyncRaf = window.requestAnimationFrame(() => {
    previewSyncRaf = 0
    const textarea = getTextarea(kind)
    if (!textarea) return
    scrollPreviewToRatio(kind, computeScrollRatio(textarea))
  })
}

const pastingImage = ref(false)

const isBusy = computed(() => {
  if (saving.value || publishing.value || pastingImage.value) return true
  if (busyAction.value === 'addToCollection') return true
  if (dailyPublishing.value) return true
  return false
})

const collectionsLoading = ref(false)
const collectionsError = ref('')
const myCollections = ref<CollectionPageResponse<CollectionSummary> | null>(null)
const selectedCollectionId = ref('')
const collectionSortOrder = ref('')
const collectionModalOpen = ref(false)

const dailyModalOpen = ref(false)
const dailyDay = ref('')
const dailyCopywriting = ref('')
const dailyPublishing = ref(false)
const dailyError = ref('')
const dailySuccess = ref('')

const problemId = computed(() => {
  const raw = route.params.id
  if (typeof raw === 'string' && raw.trim()) return raw
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].trim()) return raw[0]
  return null
})

const isEditing = computed(() => problemId.value !== null)

/**
 * Build payload from current form state.
 * @returns problem payload
 */
function buildPayload(): ProblemPayload {
  const cleanedSolution = solution.value.trim()
  const hasSolution = cleanedSolution.length > 0
  const cleanedSubject = normalizeSubject(subject.value)
  return {
    title: title.value.trim(),
    subject: cleanedSubject,
    difficulty: difficulty.value,
    statementFormat: statementFormat.value,
    statement: statement.value.trim(),
    solutionFormat: hasSolution && solutionFormat.value ? solutionFormat.value : null,
    solution: hasSolution ? cleanedSolution : null,
    visibility: visibility.value,
    tagIds: [...tagIds.value],
  }
}

async function loadTaxonomy(): Promise<void> {
  try {
    const cleanedSubject = normalizeSubject(subject.value)
    tags.value = cleanedSubject ? await taxonomyDi.listTagsUseCase.execute({ subject: cleanedSubject }) : []
  } catch {
    // Keep taxonomy optional; editor should still be usable without it.
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function loadMyCollections(): Promise<void> {
  collectionsLoading.value = true
  collectionsError.value = ''
  try {
    myCollections.value = await collectionDi.listMineUseCase.execute({
      status: 'ACTIVE',
      page: 1,
      pageSize: 100,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载题单失败。'
    collectionsError.value = message
  } finally {
    collectionsLoading.value = false
  }
}

async function openCollectionModal(): Promise<void> {
  collectionModalOpen.value = true
  collectionsError.value = ''
  selectedCollectionId.value = ''
  collectionSortOrder.value = ''
  await loadMyCollections()
}

function closeCollectionModal(): void {
  collectionModalOpen.value = false
}

function openDailyModal(): void {
  dailyModalOpen.value = true
  dailyError.value = ''
  dailySuccess.value = ''
  if (!dailyDay.value.trim()) dailyDay.value = formatDate(new Date())
}

function closeDailyModal(): void {
  dailyModalOpen.value = false
}

async function handleAddToCollection(): Promise<void> {
  if (!problemId.value) {
    collectionsError.value = '请先保存题目后再加入题单。'
    return
  }
  const cid = selectedCollectionId.value.trim()
  if (!cid) {
    collectionsError.value = '请选择一个题单。'
    return
  }

  const orderRaw = collectionSortOrder.value.trim()
  const sortOrder = orderRaw ? Number(orderRaw) : undefined
  if (orderRaw && !Number.isFinite(sortOrder)) {
    collectionsError.value = '排序必须是数字。'
    return
  }

  busyAction.value = 'addToCollection'
  collectionsError.value = ''
  successMessage.value = ''
  errorMessage.value = ''
  try {
    await collectionDi.addItemUseCase.execute(cid, {
      problemId: problemId.value,
      sortOrder,
    })
    successMessage.value = '已加入题单。'
    closeCollectionModal()
    await loadMyCollections()
  } catch (error) {
    const message = error instanceof Error ? error.message : '加入题单失败。'
    collectionsError.value = message
  } finally {
    if (busyAction.value === 'addToCollection') busyAction.value = ''
  }
}

async function handlePublishAsDaily(): Promise<void> {
  if (currentStatus.value !== 'PUBLISHED') {
    dailyError.value = '只有已发布的题目才能发布为每日一题。'
    return
  }
  if (!problemId.value) {
    dailyError.value = '题目ID无效。'
    return
  }

  const day = dailyDay.value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    dailyError.value = '日期格式应为 YYYY-MM-DD。'
    return
  }

  busyAction.value = 'publishDaily'
  dailyPublishing.value = true
  dailyError.value = ''
  dailySuccess.value = ''
  try {
    await adminDi.publishDailyProblemUseCase.execute({
      day,
      problemId: problemId.value,
      copywriting: dailyCopywriting.value.trim() || null,
    })
    dailySuccess.value = '已发布为每日一题。'
    closeDailyModal()
  } catch (error) {
    const message = error instanceof Error ? error.message : '发布每日一题失败。'
    dailyError.value = message
  } finally {
    dailyPublishing.value = false
    if (busyAction.value === 'publishDaily') busyAction.value = ''
  }
}

function wrapLatexDisplay(source: string): string {
  const trimmed = source.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('\\[') || trimmed.startsWith('$$')) return trimmed
  return `\\\\[${trimmed}\\\\]`
}

const statementPreviewHtml = computed(() => {
  const content = statement.value.trim()
  if (!content) return '<p class="helper">暂无内容。</p>'
  if (statementFormat.value === 'MARKDOWN')
    return renderMarkdown(content, { resolveUrl: resolveContentUrl, resolveImageUrl: resolveContentUrl })
  return `<pre class="md__pre"><code>${escapeHtml(content)}</code></pre>`
})

const solutionPreviewHtml = computed(() => {
  const content = solution.value.trim()
  if (!content) return '<p class="helper">暂无内容。</p>'
  const format = solutionFormat.value || 'MARKDOWN'
  if (format === 'MARKDOWN')
    return renderMarkdown(content, { resolveUrl: resolveContentUrl, resolveImageUrl: resolveContentUrl })
  return `<pre class="md__pre"><code>${escapeHtml(content)}</code></pre>`
})

const statementLatexSource = computed(() =>
  statementFormat.value === 'LATEX' ? wrapLatexDisplay(statement.value) : '',
)
const solutionLatexSource = computed(() =>
  solutionFormat.value === 'LATEX' ? wrapLatexDisplay(solution.value) : '',
)

async function typesetLatex(): Promise<void> {
  const mj = (window as unknown as { MathJax?: { typesetPromise?: (elements?: unknown[]) => Promise<void> } })
    .MathJax
  if (!mj?.typesetPromise) return
  const targets: HTMLElement[] = []
  // Typeset both explicit LaTeX mode and Markdown (when users embed $...$/$$...$$).
  if (statementPreviewRef.value && statementLatexSource.value) targets.push(statementPreviewRef.value)
  if (solutionPreviewRef.value && solutionLatexSource.value) targets.push(solutionPreviewRef.value)
  if (statementMdPreviewRef.value && statementFormat.value === 'MARKDOWN') targets.push(statementMdPreviewRef.value)
  if (solutionMdPreviewRef.value && (solutionFormat.value || 'MARKDOWN') === 'MARKDOWN')
    targets.push(solutionMdPreviewRef.value)
  if (!targets.length) return
  await mj.typesetPromise(targets)
}

/**
 * Load problem detail for editing.
 */
async function loadDetail(): Promise<void> {
  if (!isEditing.value || problemId.value === null) return
  loading.value = true
  errorMessage.value = ''
  try {
    const detail: ProblemDetail = await problemDi.getDetailUseCase.execute(problemId.value)
    suspendSubjectReset.value = true
    title.value = detail.title
    subject.value = detail.subject
    difficulty.value = detail.difficulty
    statementFormat.value = detail.statementFormat
    statement.value = detail.statement
    solutionFormat.value = detail.solutionFormat ?? ''
    solution.value = detail.solution ?? ''
    visibility.value = detail.visibility
    currentStatus.value = detail.status
    currentShareKey.value = detail.shareKey ?? ''
    tagIds.value = detail.tagIds ? [...detail.tagIds] : []
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      errorMessage.value = '题目不存在或无权限访问（若这是草稿，建议将可见性设为 PRIVATE/UNLISTED 后保存）。'
    } else {
      const message = error instanceof Error ? error.message : '加载题目失败。'
      errorMessage.value = message
    }
  } finally {
    suspendSubjectReset.value = false
    loading.value = false
  }
}

/**
 * Save problem draft (create or update).
 */
async function handleSave(): Promise<void> {
  const cleanedSubject = normalizeSubject(subject.value)
  if (!title.value.trim() || !statement.value.trim() || !cleanedSubject) {
    errorMessage.value = '标题、学科、题目描述为必填。'
    return
  }
  rememberSubject(cleanedSubject)

  busyAction.value = 'save'
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const payload = buildPayload()
    if (isEditing.value && problemId.value !== null) {
      const status = await problemDi.updateUseCase.execute(problemId.value, payload)
      successMessage.value = '保存成功。'
      currentStatus.value = status.status
      currentShareKey.value = status.shareKey ?? ''
    } else {
      const created = await problemDi.createUseCase.execute(payload)
      successMessage.value = '保存成功。'
      currentStatus.value = created.status
      currentShareKey.value = created.shareKey ?? ''
      await router.replace(`/me/problems/${created.id}/edit`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存题目失败。'
    errorMessage.value = message
  } finally {
    saving.value = false
    if (busyAction.value === 'save') busyAction.value = ''
  }
}

/**
 * Publish current problem.
 */
async function handlePublish(): Promise<void> {
  if (problemId.value === null) return
  const cleanedSubject = normalizeSubject(subject.value)
  if (!cleanedSubject) {
    errorMessage.value = '学科不能为空。'
    return
  }
  rememberSubject(cleanedSubject)
  if (!currentStatus.value) {
    const ok = window.confirm('当前题目状态未知（可能是详情加载失败）。仍要尝试发布吗？')
    if (!ok) return
  }
  busyAction.value = 'publish'
  publishing.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const status = await problemDi.publishUseCase.execute(problemId.value, {
      subject: cleanedSubject,
      tagIds: tagIds.value,
      newTags: pendingNewTags.value.length ? [...pendingNewTags.value] : undefined,
    })
    currentStatus.value = status.status
    currentShareKey.value = status.shareKey ?? ''
    successMessage.value = '发布成功。'
    pendingNewTags.value = []
    // Refresh detail to get merged tagIds/tags from backend.
    await loadDetail()
    await loadTaxonomy()
  } catch (error) {
    const message = error instanceof Error ? error.message : '发布题目失败。'
    errorMessage.value = message
  } finally {
    publishing.value = false
    if (busyAction.value === 'publish') busyAction.value = ''
  }
}

/**
 * Delete a draft problem.
 */
async function handleDelete(): Promise<void> {
  if (problemId.value === null) return
  publishing.value = true
  busyAction.value = 'delete'
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await problemDi.deleteUseCase.execute(problemId.value)
    successMessage.value = '题目已删除。'
    await router.push('/me/problems')
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除题目失败。'
    errorMessage.value = message
  } finally {
    publishing.value = false
    if (busyAction.value === 'delete') busyAction.value = ''
  }
}

/**
 * Disable (take down) a published problem.
 */
async function handleDisable(): Promise<void> {
  if (problemId.value === null) return
  const ok = window.confirm('确定下架该题目吗？下架后将变为“已下架”。')
  if (!ok) return
  busyAction.value = 'disable'
  publishing.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const status = await problemDi.disableUseCase.execute(problemId.value)
    currentStatus.value = status.status
    currentShareKey.value = status.shareKey ?? ''
    successMessage.value = '下架成功。'
  } catch (error) {
    const message = error instanceof Error ? error.message : '下架失败。'
    errorMessage.value = message
  } finally {
    publishing.value = false
    if (busyAction.value === 'disable') busyAction.value = ''
  }
}

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

function insertAtCursor(model: { value: string }, el: HTMLTextAreaElement | null, text: string): void {
  if (!el) {
    model.value = `${model.value}${text}`
    return
  }
  const start = Number.isFinite(el.selectionStart) ? (el.selectionStart ?? model.value.length) : model.value.length
  const end = Number.isFinite(el.selectionEnd) ? (el.selectionEnd ?? model.value.length) : model.value.length
  model.value = `${model.value.slice(0, start)}${text}${model.value.slice(end)}`
  void nextTick().then(() => {
    const pos = start + text.length
    try {
      el.focus()
      el.setSelectionRange(pos, pos)
    } catch {
      // Ignore selection failures (e.g., mobile browsers).
    }
  })
}

function buildImageSnippet(format: 'MARKDOWN' | 'LATEX', shareUrl: string, alt: string): string {
  if (format === 'LATEX') {
    return `\n\n\\\\includegraphics[width=\\\\linewidth]{${shareUrl}}\n\n`
  }
  const safeAlt = alt.trim() || 'image'
  return `\n\n![${safeAlt}](${shareUrl})\n\n`
}

async function handlePaste(event: ClipboardEvent, target: 'statement' | 'solution'): Promise<void> {
  const items = event.clipboardData?.items
  if (!items?.length) return

  const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'))
  if (!imageItem) return

  const file = imageItem.getAsFile()
  if (!file) return

  event.preventDefault()
  pastingImage.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const upload = await fileDi.uploadUseCase.execute(file)
    uploadedItems.value = [...uploadedItems.value, { fileId: upload.id, shareUrl: upload.shareUrl }]

    const isStatement = target === 'statement'
    const format: 'MARKDOWN' | 'LATEX' = isStatement
      ? statementFormat.value
      : (solutionFormat.value || 'MARKDOWN')

    const snippet = buildImageSnippet(
      format,
      upload.shareUrl,
      upload.originalFilename || file.name || 'image',
    )
    if (isStatement) {
      insertAtCursor(statement, statementTextareaRef.value, snippet)
    } else {
      insertAtCursor(solution, solutionTextareaRef.value, snippet)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '粘贴图片失败。'
    errorMessage.value = message
  } finally {
    pastingImage.value = false
  }
}

onMounted(() => {
  loadSubjectSuggestions()
  dailyDay.value = formatDate(new Date())
  void loadDetail()
  void loadTaxonomy()
  // If MathJax loads after the initial render, retry typesetting a few times.
  let attempts = 0
  const timer = window.setInterval(() => {
    attempts += 1
    const mj = (window as unknown as { MathJax?: { typesetPromise?: unknown } }).MathJax
    if (mj?.typesetPromise) {
      window.clearInterval(timer)
      void nextTick().then(typesetLatex)
      return
    }
    if (attempts >= 10) {
      window.clearInterval(timer)
    }
  }, 500)

  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeyDown)
  if (previewSyncRaf) window.cancelAnimationFrame(previewSyncRaf)
  if (subjectDebounceTimer) window.clearTimeout(subjectDebounceTimer)
})

watch(
  [statement, statementFormat, solution, solutionFormat],
  async () => {
    await nextTick()
    await typesetLatex()
    schedulePreviewSync(activeEditor.value)
  },
  { flush: 'post' },
)

watch(problemId, () => {
  void loadDetail()
})

watch(subject, () => {
  if (!suspendSubjectReset.value) {
    tagIds.value = []
  }
  tagKeyword.value = ''
  tagMenuOpen.value = false
  newTagName.value = ''
  pendingNewTags.value = []
  if (subjectDebounceTimer) window.clearTimeout(subjectDebounceTimer)
  subjectDebounceTimer = window.setTimeout(() => {
    void loadTaxonomy()
  }, 300)
})
</script>

<template>
  <section class="page page--editor">
    <header class="page__header">
      <h1 class="page__title">题目编辑</h1>
    </header>

    <div class="editor__grid">
      <div class="card card--stack">
        <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="helper">{{ successMessage }}</p>
        <p v-if="currentStatus" class="helper">状态：{{ statusLabels[currentStatus] ?? currentStatus }}</p>
        <p v-if="currentShareKey" class="helper">分享码：{{ currentShareKey }}</p>
        <p v-if="loading" class="helper">加载中...</p>
        <label class="field">
          <span>标题</span>
          <input v-model="title" type="text" placeholder="题目标题" />
        </label>
        <label class="field">
          <span>学科</span>
          <SubjectCombobox
            v-model="subject"
            :options="subjectSuggestions"
            placeholder="点击输入筛选 / 也可直接输入新学科（例如：CHEMISTRY / 化学）"
            :max-length="64"
            :allow-empty="false"
            @blur="(v) => rememberSubject(v)"
          />
          <p class="helper">提示：输入内容会筛选下拉候选；选中后会填回输入框；也可直接输入新学科。</p>
        </label>
        <label class="field">
          <span>难度</span>
          <input v-model.number="difficulty" type="number" min="1" max="5" />
        </label>
        <label class="field">
          <span>可见性</span>
          <select v-model="visibility">
            <option value="PUBLIC">公开</option>
            <option value="UNLISTED">不公开列出</option>
            <option value="PRIVATE">私有</option>
          </select>
        </label>
        <label class="field">
          <span>标签</span>
          <div class="tag-filter">
            <button class="select-like" type="button" @click="toggleTagMenu">
              <span class="select-like__value">{{ tagButtonLabel }}</span>
              <span class="select-like__chevron" aria-hidden="true">▾</span>
            </button>

            <div v-if="tagMenuOpen" class="tag-filter__menu tag-filter__menu--wide" role="menu">
              <div class="tag-filter__header">
                <input v-model="tagKeyword" class="tag-filter__search" type="text" placeholder="搜索标签" />
                <button class="button button--ghost" type="button" :disabled="!tagIds.length" @click="clearTagFilters">
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

              <div class="tag-filter__new">
                <input v-model="newTagName" class="tag-filter__search" type="text" placeholder="新增标签（回车添加）" @keydown.enter.prevent="addPendingTag" />
                <button class="button button--ghost" type="button" :disabled="!newTagName.trim()" @click="addPendingTag">
                  添加
                </button>
              </div>

              <div v-if="pendingNewTags.length" class="tag-filter__selected">
                <span class="helper">待创建：</span>
                <div class="tag-filter__selectedList">
                  <button
                    v-for="name in pendingNewTags"
                    :key="name"
                    class="tag-pill tag-pill--button"
                    type="button"
                    @click="removePendingTag(name)"
                    :title="`点击移除：${name}`"
                  >
                    {{ name }} ×
                  </button>
                </div>
              </div>
              <p v-if="pendingNewTags.length" class="helper">提示：待创建标签只会在“发布”时由服务端创建并合并。</p>

              <div class="tag-filter__list">
                <label v-for="item in filteredTags" :key="item.id" class="tag-filter__item">
                  <input v-model="tagIds" type="checkbox" :value="item.id" />
                  <span>{{ item.name }}</span>
                </label>
                <p v-if="!filteredTags.length" class="helper">没有匹配的标签。</p>
              </div>
            </div>
          </div>
        </label>
        <label class="field">
          <span>题面格式</span>
          <select v-model="statementFormat">
            <option value="MARKDOWN">Markdown</option>
            <option value="LATEX">LaTeX</option>
          </select>
        </label>
        <label class="field">
          <span>题目描述</span>
          <textarea
            ref="statementTextareaRef"
            v-model="statement"
            rows="8"
            placeholder="题目描述（支持 Ctrl/Command + V 粘贴截图自动上传）"
            @focus="activeEditor = 'statement'"
            @scroll="schedulePreviewSync('statement')"
            @input="schedulePreviewSync('statement')"
            @paste="(e) => handlePaste(e as ClipboardEvent, 'statement')"
          ></textarea>
        </label>
        <label class="field">
          <span>解答格式（可选）</span>
          <select v-model="solutionFormat">
            <option value="">无</option>
            <option value="MARKDOWN">Markdown</option>
            <option value="LATEX">LaTeX</option>
          </select>
        </label>
        <label class="field">
          <span>解答</span>
          <textarea
            ref="solutionTextareaRef"
            v-model="solution"
            rows="8"
            placeholder="解答（支持 Ctrl/Command + V 粘贴截图自动上传）"
            @focus="activeEditor = 'solution'"
            @scroll="schedulePreviewSync('solution')"
            @input="schedulePreviewSync('solution')"
            @paste="(e) => handlePaste(e as ClipboardEvent, 'solution')"
          ></textarea>
        </label>
        <p v-if="pastingImage" class="helper">正在上传剪贴板图片...</p>
        <div v-if="uploadedItems.length" class="card card--stack">
          <h2 class="card__title">已上传资源</h2>
          <ul class="list">
            <li v-for="item in uploadedItems" :key="item.fileId" class="list__item">
              <div>
                <strong>#{{ item.fileId }}</strong>
                <p class="helper">{{ item.shareUrl }}</p>
              </div>
            </li>
          </ul>
        </div>
        <div class="actions">
          <button class="button" :class="{ 'button--busy': busyAction === 'save' }" :disabled="isBusy" @click="handleSave">
            {{ busyAction === 'save' ? '保存中...' : '保存草稿' }}
          </button>
          <button
            v-if="isEditing && currentStatus !== 'PUBLISHED'"
            class="button button--ghost"
            :class="{ 'button--busy': busyAction === 'publish' }"
            :disabled="isBusy"
            @click="handlePublish"
          >
            {{
              busyAction === 'publish'
                ? '发布中...'
                : (currentStatus === 'DISABLED' ? '重新发布' : '发布')
            }}
          </button>
          <button
            v-if="isEditing && currentStatus === 'PUBLISHED'"
            class="button button--ghost"
            :class="{ 'button--busy': busyAction === 'disable' }"
            :disabled="isBusy"
            @click="handleDisable"
          >
            {{ busyAction === 'disable' ? '下架中...' : '下架' }}
          </button>
          <button
            v-if="isEditing && currentStatus === 'DRAFT'"
            class="button button--ghost"
            :class="{ 'button--busy': busyAction === 'delete' }"
            :disabled="isBusy"
            @click="handleDelete"
          >
            {{ busyAction === 'delete' ? '删除中...' : '删除草稿' }}
          </button>
        </div>
        <div class="actions actions--secondary">
          <button
            class="button button--ghost"
            type="button"
            :disabled="isBusy"
            @click="openCollectionModal"
          >
            加入题单
          </button>
          <button
            class="button button--ghost"
            type="button"
            :disabled="isBusy"
            @click="openDailyModal"
          >
            发布为每日一题
          </button>
        </div>
      </div>

      <aside ref="previewAsideRef" class="card card--stack preview">
        <header class="page__header">
          <div class="actions" style="align-items: center; justify-content: space-between;">
            <h2 class="card__title" style="margin: 0;">实时预览</h2>
            <button class="button button--ghost" type="button" @click="followPreviewScroll = !followPreviewScroll">
              {{ followPreviewScroll ? '跟随：开' : '跟随：关' }}
            </button>
          </div>
          <p class="helper">右侧预览会根据格式选择渲染；LaTeX 依赖 MathJax（若加载失败会回退显示源文本）。</p>
        </header>

        <div class="card card--stack">
          <h3 class="card__title">题目预览</h3>
          <div
            v-if="statementFormat === 'LATEX'"
            ref="statementPreviewRef"
            class="preview__content latex"
            v-text="statementLatexSource || statement.trim()"
          ></div>
          <div v-else ref="statementMdPreviewRef" class="preview__content md" v-html="statementPreviewHtml"></div>
        </div>

        <div class="card card--stack">
          <h3 class="card__title">解答预览</h3>
          <p v-if="!solutionFormat" class="helper">未选择解答格式（可选）。</p>
          <div
            v-else-if="solutionFormat === 'LATEX'"
            ref="solutionPreviewRef"
            class="preview__content latex"
            v-text="solutionLatexSource || solution.trim()"
          ></div>
          <div v-else ref="solutionMdPreviewRef" class="preview__content md" v-html="solutionPreviewHtml"></div>
        </div>
      </aside>
    </div>
  </section>

  <div v-if="collectionModalOpen" class="modal" @click.self="closeCollectionModal">
    <div class="modal__panel card card--stack">
      <header class="page__header">
        <h2 class="card__title">加入题单</h2>
        <p class="helper">提示：需要先“保存草稿”拿到题目ID。</p>
      </header>

      <p v-if="collectionsError" class="helper helper--error">{{ collectionsError }}</p>
      <p v-else-if="collectionsLoading" class="helper">正在加载题单...</p>
      <template v-else>
        <p v-if="!myCollections?.items?.length" class="helper">
          你还没有题单。可以先去
          <router-link class="link" to="/me/collections/new" @click="closeCollectionModal">新建题单</router-link>
          。
        </p>
        <template v-else>
          <label class="field">
            <span>选择题单</span>
            <select v-model="selectedCollectionId">
              <option value="">请选择</option>
              <option v-for="c in myCollections.items" :key="c.id" :value="c.id">
                {{ c.name }}（{{ c.visibility }}）
              </option>
            </select>
          </label>
          <label class="field">
            <span>排序（可选）</span>
            <input v-model="collectionSortOrder" type="number" placeholder="例如 10" />
          </label>
        </template>
      </template>

      <div class="actions">
        <button class="button button--ghost" type="button" :disabled="isBusy" @click="loadMyCollections">
          刷新题单
        </button>
        <button
          class="button"
          type="button"
          :disabled="isBusy || !problemId"
          :class="{ 'button--busy': busyAction === 'addToCollection' }"
          @click="handleAddToCollection"
        >
          {{ busyAction === 'addToCollection' ? '加入中...' : '确认加入' }}
        </button>
        <button class="button button--ghost" type="button" :disabled="isBusy" @click="closeCollectionModal">
          关闭
        </button>
      </div>
    </div>
  </div>

  <div v-if="dailyModalOpen" class="modal" @click.self="closeDailyModal">
    <div class="modal__panel card card--stack">
      <header class="page__header">
        <h2 class="card__title">发布为每日一题</h2>
        <p v-if="currentStatus !== 'PUBLISHED'" class="helper">仅已发布题目可发布为每日一题。</p>
      </header>

      <p v-if="dailyError" class="helper helper--error">{{ dailyError }}</p>
      <p v-if="dailySuccess" class="helper">{{ dailySuccess }}</p>

      <label class="field">
        <span>日期（YYYY-MM-DD）</span>
        <input v-model="dailyDay" type="text" placeholder="2026-01-29" />
      </label>
      <label class="field">
        <span>文案（可选）</span>
        <input v-model="dailyCopywriting" type="text" placeholder="可选说明" />
      </label>

      <div class="actions">
        <button
          class="button"
          type="button"
          :class="{ 'button--busy': busyAction === 'publishDaily' || dailyPublishing }"
          :disabled="isBusy || dailyPublishing || currentStatus !== 'PUBLISHED' || !problemId"
          @click="handlePublishAsDaily"
        >
          {{ dailyPublishing ? '发布中...' : '确认发布' }}
        </button>
        <button class="button button--ghost" type="button" :disabled="isBusy" @click="closeDailyModal">
          关闭
        </button>
      </div>
      <p class="helper">说明：该操作会发布/替换指定日期的每日一题（需要登录）。</p>
    </div>
  </div>
</template>
