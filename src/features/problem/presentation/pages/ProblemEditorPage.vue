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
	import SelectCombobox from '../../../../infrastructure/components/SelectCombobox.vue'
	import { useCollectionDi } from '../../../collection/di'
	import type { CollectionSummary, PageResponse as CollectionPageResponse } from '../../../collection/domain/models'
	import { useAdminDi } from '../../../admin/di'
	import { HttpError } from '../../../../infrastructure/http'
	import { runtimeConfig } from '../../../../infrastructure/config'
	import { escapeHtml, renderMarkdown } from '../utils/markdown'
	import { toPublicFileUrl } from '../../../file/presentation/utils/fileShareUrl'
	import { useAiDi } from '../../../ai/di'
	import type { AiProblemMetadataRecommendations, AiProblemMetadataRecommendationsRequest } from '../../../ai/domain/models'

const problemDi = useProblemDi()
const fileDi = useFileDi()
	const taxonomyDi = useTaxonomyDi()
	const collectionDi = useCollectionDi()
	const adminDi = useAdminDi()
	const aiDi = useAiDi()
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

type ComboOptionItem = { value: string; label: string; hint?: string }

const visibilityOptions: ComboOptionItem[] = [
  { value: 'PUBLIC', label: '公开' },
  { value: 'UNLISTED', label: '不公开列出' },
  { value: 'PRIVATE', label: '私有' },
]

const statementFormatOptions: ComboOptionItem[] = [
  { value: 'MARKDOWN', label: 'Markdown' },
  { value: 'LATEX', label: 'LaTeX' },
]

const solutionFormatOptions: ComboOptionItem[] = [
  { value: '', label: '无' },
  { value: 'MARKDOWN', label: 'Markdown' },
  { value: 'LATEX', label: 'LaTeX' },
]

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
	const tagNames = ref<string[]>([])
	const tagsDirty = ref(false)
	const tagMenuOpen = ref(false)
	const tagKeyword = ref('')
	const newTagName = ref('')

	const SUBJECT_SUGGESTIONS_KEY = 'vf.subjects.recent'
	const subjectSuggestions = ref<string[]>(['MATH', 'PHYSICS'])
	let subjectDebounceTimer = 0

	const aiMetaModalOpen = ref(false)
	const aiMetaAction = ref<'' | 'publish' | 'save'>('')
	const aiMetaLoading = ref(false)
	const aiMetaError = ref('')
	const aiMeta = ref<AiProblemMetadataRecommendations | null>(null)
	const aiTitlePick = ref('')
	const aiMetaCache = ref<AiProblemMetadataRecommendations | null>(null)
	const aiMetaCacheDirty = ref(true)

/**
 * Invalidate cached AI recommendations when core content changes.
 */
function invalidateAiMetaCache(): void {
  aiMetaCache.value = null
  aiMetaCacheDirty.value = true
}

/**
 * Pick a sensible default title suggestion for the title dropdown.
 * @param next - AI response payload.
 */
function syncAiTitlePick(next: AiProblemMetadataRecommendations | null): void {
  const list = (next?.titleSuggestions ?? []).map((t) => String(t ?? '').trim()).filter(Boolean)
  if (!list.length) {
    aiTitlePick.value = ''
    return
  }
  const current = aiTitlePick.value.trim()
  if (current && list.includes(current)) return
  aiTitlePick.value = list[0] ?? ''
}

const aiTitleOptionItems = computed<ComboOptionItem[]>(() => {
  const list = (aiMeta.value?.titleSuggestions ?? []).map((t) => String(t ?? '').trim()).filter(Boolean)
  return list.map((t) => ({ value: t, label: t }))
})

	const aiSubjectTarget = computed(() => String(aiMeta.value?.subjectRecommendation?.value ?? '').trim())
	const aiDifficultyTarget = computed(() => {
	  const raw = aiMeta.value?.difficultyRecommendation?.value
	  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null
	  return Math.min(5, Math.max(1, Math.round(raw)))
	})

/**
 * Compare tag arrays in a stable, case-insensitive way.
 * @param a - Tags A.
 * @param b - Tags B.
 * @returns Whether tags are equal.
 */
function equalTagNames(a: string[], b: string[]): boolean {
  const ka = normalizeTagNames(a).map((t) => t.toLowerCase()).sort().join('\n')
  const kb = normalizeTagNames(b).map((t) => t.toLowerCase()).sort().join('\n')
  return ka === kb
}

/**
 * Compute what tags would look like after applying AI recommendations.
 * @returns Next tag list (normalized).
 */
function computeAiTagsNext(): string[] {
  if (!aiMeta.value) return normalizeTagNames(tagNames.value)
  const adds = (aiMeta.value.tagRecommendations?.add ?? []).map(normalizeTagName).filter(Boolean)
  const removes = new Set(
    (aiMeta.value.tagRecommendations?.remove ?? [])
      .map((t) => normalizeTagName(t).toLowerCase())
      .filter(Boolean),
  )
  const base = normalizeTagNames(tagNames.value).filter((t) => !removes.has(t.toLowerCase()))
  return normalizeTagNames([...base, ...adds])
}

	const canApplyTitle = computed(() => {
	  const target = aiTitlePick.value.trim()
	  if (!target) return false
	  return target !== title.value.trim()
	})
	const canApplySubject = computed(() => {
	  const target = aiSubjectTarget.value
	  if (!target) return false
	  return target !== subject.value.trim()
	})
	const canApplyDifficulty = computed(() => {
	  const target = aiDifficultyTarget.value
	  if (target === null) return false
	  return target !== difficulty.value
	})
	const canApplyTags = computed(() => {
	  if (!aiMeta.value) return false
	  const hasDelta = Boolean(aiMeta.value.tagRecommendations?.add?.length || aiMeta.value.tagRecommendations?.remove?.length)
	  if (!hasDelta) return false
	  return !equalTagNames(tagNames.value, computeAiTagsNext())
	})
	const canApplyAll = computed(() => canApplyTitle.value || canApplySubject.value || canApplyDifficulty.value || canApplyTags.value)

/**
 * Normalize a subject value for API usage.
 * @param value raw subject
 * @returns normalized subject
 */
function normalizeSubject(value: string): string {
  return value.trim().slice(0, 64)
}

/**
 * Load recent subject suggestions from localStorage (best-effort).
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
    // Ignore storage issues.
  }
}

/**
 * Persist a subject value into the recent suggestions list.
 * @param value subject value
 */
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

	/**
	 * Normalize a single tag name (trim + max-length).
	 * @param value - Raw tag name.
	 * @returns Normalized tag name.
	 */
	function normalizeTagName(value: string): string {
	  return String(value ?? '').trim().slice(0, 32)
	}

	/**
	 * Normalize tags array: trim, drop empties, de-dupe case-insensitively (keeps order).
	 * @param values - Raw tag list.
	 * @returns Normalized tag list.
	 */
	function normalizeTagNames(values: string[]): string[] {
	  const out: string[] = []
	  const seen = new Set<string>()
	  for (const raw of values) {
	    const name = normalizeTagName(raw)
	    if (!name) continue
	    const key = name.toLowerCase()
	    if (seen.has(key)) continue
	    seen.add(key)
	    out.push(name)
	  }
	  return out.slice(0, 30)
	}

	const tagButtonLabel = computed(() => {
	  const names = normalizeTagNames(tagNames.value)
	  if (!names.length) return '全部'
	  if (names.length <= 2) return names.join(', ')
	  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
	})

const filteredTags = computed(() => {
  const kw = tagKeyword.value.trim().toLowerCase()
  if (!kw) return tags.value
  return tags.value.filter((t) => t.name.toLowerCase().includes(kw))
})

/**
 * Toggle the tag filter menu.
 */
function toggleTagMenu(): void {
  tagMenuOpen.value = !tagMenuOpen.value
}

/**
 * Close the tag filter menu.
 */
function closeTagMenu(): void {
  tagMenuOpen.value = false
}

/**
 * Clear selected and pending tags.
 */
	function clearTagFilters(): void {
	  tagNames.value = []
	}

	/**
	 * Add the current new tag name into the selected tag list.
	 */
	function addCustomTag(): void {
	  const name = newTagName.value.trim()
	  if (!name) return
	  const normalized = normalizeTagName(name)
	  if (!normalized) return
	  const exists = normalizeTagNames(tagNames.value).some((t) => t.toLowerCase() === normalized.toLowerCase())
	  if (exists) {
	    newTagName.value = ''
	    return
	  }
	  tagNames.value = [...normalizeTagNames([...tagNames.value, normalized])]
	  newTagName.value = ''
	}

	/**
	 * Remove a selected tag by name.
	 * @param name - Tag name.
	 */
	function removeTag(name: string): void {
	  const key = normalizeTagName(name).toLowerCase()
	  tagNames.value = normalizeTagNames(tagNames.value).filter((t) => t.toLowerCase() !== key)
	}

/**
 * Close tag menu on outside clicks.
 * @param event click event
 */
function onDocumentClick(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (target.closest('.tag-filter') === null) closeTagMenu()
}

/**
 * Close tag menu on Escape.
 * @param event keyboard event
 */
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
let mathjaxRetryTimer: number | null = null
let typesetInFlight = false
let typesetPending = false

/**
 * Clamp a ratio to [0, 1].
 * @param value input value
 * @returns clamped value
 */
function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

/**
 * Get textarea element for the given editor kind.
 * @param kind editor kind
 * @returns textarea element or null
 */
function getTextarea(kind: 'statement' | 'solution'): HTMLTextAreaElement | null {
  return kind === 'statement' ? statementTextareaRef.value : solutionTextareaRef.value
}

/**
 * Get the preview element corresponding to the given editor kind.
 * @param kind editor kind
 * @returns preview element or null
 */
function getPreviewElement(kind: 'statement' | 'solution'): HTMLElement | null {
  if (kind === 'statement') {
    return statementFormat.value === 'LATEX' ? statementPreviewRef.value : statementMdPreviewRef.value
  }
  return solutionFormat.value === 'LATEX' ? solutionPreviewRef.value : solutionMdPreviewRef.value
}

/**
 * Compute scroll progress ratio for an element.
 * @param el scroll element
 * @returns ratio in [0, 1]
 */
function computeScrollRatio(el: HTMLElement): number {
  const max = el.scrollHeight - el.clientHeight
  if (max <= 0) return 0
  return clamp01(el.scrollTop / max)
}

/**
 * Scroll preview based on textarea scroll ratio.
 * @param kind editor kind
 * @param ratio scroll ratio
 */
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

/**
 * Schedule preview scroll sync on next animation frame.
 * @param kind editor kind
 */
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
	  const normalizedTags = normalizeTagNames(tagNames.value)
	  return {
	    title: title.value.trim(),
	    subject: cleanedSubject,
	    difficulty: difficulty.value,
	    statementFormat: statementFormat.value,
	    statement: statement.value.trim(),
	    solutionFormat: hasSolution && solutionFormat.value ? solutionFormat.value : null,
	    solution: hasSolution ? cleanedSolution : null,
	    visibility: visibility.value,
	    // For updates: omit tags unless user explicitly touched the tag selection.
	    tags: isEditing.value ? (tagsDirty.value ? normalizedTags : null) : normalizedTags,
	  }
	}

	/**
	 * Build AI metadata recommendation request from current form state.
	 * @returns AI request payload.
	 */
	function buildAiMetaRequest(): AiProblemMetadataRecommendationsRequest {
	  const cleanedSolution = solution.value.trim()
	  const hasSolution = cleanedSolution.length > 0 && Boolean(solutionFormat.value)
	  return {
	    title: title.value.trim(),
	    subjectInput: subject.value.trim(),
	    statementFormat: statementFormat.value,
	    statement: statement.value.trim(),
	    solutionFormat: hasSolution ? (solutionFormat.value as 'MARKDOWN' | 'LATEX') : null,
	    solution: hasSolution ? cleanedSolution : null,
	    existingTags: normalizeTagNames(tagNames.value),
	    difficultyRange: { min: 1, max: 5 },
	    maxTitleSuggestions: 3,
	    maxTagAddCount: 5,
	  }
	}

	/**
	 * Open AI metadata recommendations modal and fetch suggestions.
	 * @param action - Action that triggered the modal.
	 * @param options - Modal options.
	 * @param options.forceRefresh - When true, bypass cache and re-generate suggestions.
	 */
		async function openAiMetaModal(action: 'publish' | 'save', options?: { forceRefresh?: boolean }): Promise<void> {
		  aiMetaModalOpen.value = true
		  aiMetaAction.value = action
		  aiMetaError.value = ''
		  const forceRefresh = Boolean(options?.forceRefresh)
		  const canUseCache = !forceRefresh && !aiMetaCacheDirty.value && aiMetaCache.value !== null
		  if (canUseCache) {
		    aiMeta.value = aiMetaCache.value
		    aiMetaLoading.value = false
		    syncAiTitlePick(aiMeta.value)
		    return
		  }
		  aiMeta.value = null
		  aiMetaLoading.value = true
		  try {
		    aiMeta.value = await aiDi.getProblemMetadataRecommendationsUseCase.execute(buildAiMetaRequest())
		    aiMetaCache.value = aiMeta.value
		    aiMetaCacheDirty.value = false
		    syncAiTitlePick(aiMeta.value)
		  } catch (error) {
		    const message = error instanceof Error ? error.message : 'AI 建议获取失败。'
		    aiMetaError.value = message
		  } finally {
		    aiMetaLoading.value = false
		  }
		}

	/**
	 * Close AI metadata modal.
	 */
	function closeAiMetaModal(): void {
	  aiMetaModalOpen.value = false
	  aiMetaAction.value = ''
	}

	/**
	 * Refresh AI metadata recommendations (best-effort).
	 */
	function refreshAiMeta(): void {
	  if (!aiMetaAction.value) return
	  void openAiMetaModal(aiMetaAction.value, { forceRefresh: true })
	}

		/**
		 * Apply AI title recommendation (best-effort).
		 * @param next - Optional title to apply (e.g., user-picked suggestion).
		 */
		function applyAiTitle(next?: string): void {
		  if (!aiMeta.value) return
		  const rec = aiMeta.value
		  const requested = String(next ?? '').trim()
		  const firstSuggestion = (rec.titleSuggestions ?? []).find((t) => String(t ?? '').trim().length > 0)
		  const picked = requested || (firstSuggestion ? String(firstSuggestion).trim() : '')
		  if (picked) title.value = picked
		}

		/**
		 * Apply AI subject recommendation (best-effort).
		 */
		function applyAiSubject(): void {
		  if (!aiMeta.value) return
		  const nextSubject = aiMeta.value.subjectRecommendation?.value?.trim?.()
		    ? String(aiMeta.value.subjectRecommendation.value).trim()
		    : ''
		  if (!nextSubject) return
		  suspendSubjectReset.value = true
		  try {
		    subject.value = nextSubject
		  } finally {
		    queueMicrotask(() => {
		      suspendSubjectReset.value = false
		    })
		  }
		}

		/**
		 * Apply AI difficulty recommendation (best-effort).
		 */
		function applyAiDifficulty(): void {
		  if (!aiMeta.value) return
		  const nextDifficulty = aiMeta.value.difficultyRecommendation?.value
		  if (typeof nextDifficulty !== 'number' || !Number.isFinite(nextDifficulty)) return
		  difficulty.value = Math.min(5, Math.max(1, Math.round(nextDifficulty)))
		}

		/**
		 * Apply AI tag recommendations (best-effort).
		 */
		function applyAiTags(): void {
		  if (!aiMeta.value) return
		  tagNames.value = computeAiTagsNext()
		  tagsDirty.value = true
		}

		/**
		 * Apply all AI metadata recommendations (best-effort).
		 */
		function applyAiAll(): void {
		  applyAiTitle()
		  applyAiSubject()
		  applyAiDifficulty()
		  applyAiTags()
		}

	/**
	 * Run publish flow: optionally apply AI suggestions, then save draft and publish.
	 * @param options - Flow options.
	 * @param options.apply - Apply AI recommendations before saving/publishing.
	 */
	async function runPublishFlow(options: { apply: boolean }): Promise<void> {
	  if (problemId.value === null) return
	  closeAiMetaModal()
	  const cleanedSubject = normalizeSubject(subject.value)
	  if (!title.value.trim() || !statement.value.trim() || !cleanedSubject) {
	    errorMessage.value = '标题、学科、题目描述为必填。'
	    return
	  }
	  rememberSubject(cleanedSubject)

	  busyAction.value = 'publish'
	  publishing.value = true
	  errorMessage.value = ''
		  successMessage.value = ''
		  try {
		    if (options.apply) applyAiAll()
		    const payload = buildPayload()
	    // Migration: publish API no longer accepts a body; content updates must be saved before publish.
	    const updatedStatus = await problemDi.updateUseCase.execute(problemId.value, payload)
	    currentStatus.value = updatedStatus.status
	    currentShareKey.value = updatedStatus.shareKey ?? ''

	    const status = await problemDi.publishUseCase.execute(problemId.value)
	    currentStatus.value = status.status
	    currentShareKey.value = status.shareKey ?? ''
	    successMessage.value = '发布成功。'
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
	 * Run save flow for published problems: optionally apply AI suggestions, then update.
	 * @param options - Flow options.
	 * @param options.apply - Apply AI recommendations before saving.
	 */
	async function runSaveFlow(options: { apply: boolean }): Promise<void> {
	  if (problemId.value === null) return
	  closeAiMetaModal()
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
		    if (options.apply) applyAiAll()
		    const payload = buildPayload()
	    const status = await problemDi.updateUseCase.execute(problemId.value, payload)
	    successMessage.value = '保存成功。'
	    currentStatus.value = status.status
	    currentShareKey.value = status.shareKey ?? ''
	    await loadDetail()
	  } catch (error) {
	    const message = error instanceof Error ? error.message : '保存题目失败。'
	    errorMessage.value = message
	  } finally {
	    saving.value = false
	    if (busyAction.value === 'save') busyAction.value = ''
	  }
	}

/**
 * Load taxonomy data (tags) for the current subject (best-effort).
 */
async function loadTaxonomy(): Promise<void> {
  try {
    const cleanedSubject = normalizeSubject(subject.value)
    tags.value = cleanedSubject ? await taxonomyDi.listTagsUseCase.execute({ subject: cleanedSubject }) : []
  } catch {
    // Keep taxonomy optional; editor should still be usable without it.
  }
}

/**
 * Format a date as YYYY-MM-DD.
 * @param date date value
 * @returns formatted date
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Load collections owned by the current user.
 */
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

/**
 * Open the "add to collection" modal.
 */
async function openCollectionModal(): Promise<void> {
  collectionModalOpen.value = true
  collectionsError.value = ''
  selectedCollectionId.value = ''
  collectionSortOrder.value = ''
  await loadMyCollections()
}

/**
 * Close the "add to collection" modal.
 */
function closeCollectionModal(): void {
  collectionModalOpen.value = false
}

/**
 * Open the "publish as daily" modal.
 */
function openDailyModal(): void {
  dailyModalOpen.value = true
  dailyError.value = ''
  dailySuccess.value = ''
  if (!dailyDay.value.trim()) dailyDay.value = formatDate(new Date())
}

/**
 * Close the "publish as daily" modal.
 */
function closeDailyModal(): void {
  dailyModalOpen.value = false
}

/**
 * Add the current problem to a selected collection.
 */
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

/**
 * Publish the current problem as the daily problem for a given day.
 */
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

/**
 * Ensure LaTeX content is wrapped as display math for MathJax rendering.
 * @param source raw LaTeX
 * @returns display-wrapped source
 */
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

/**
 * Typeset LaTeX in both LaTeX mode and Markdown preview panes (best-effort).
 */
async function typesetLatex(): Promise<void> {
  const mj = (window as unknown as { MathJax?: { typesetPromise?: (elements?: unknown[]) => Promise<void> } })
    .MathJax
  if (!mj?.typesetPromise) return
  // MathJax may expose typesetPromise before startup fully resolves; await readiness best-effort.
  try {
    const startup = (mj as unknown as { startup?: { promise?: Promise<unknown> } }).startup?.promise
    if (startup) await startup
  } catch {
    // Ignore startup failures; we'll fall back to raw TeX rendering.
  }
  const targets: HTMLElement[] = []
  // Typeset both explicit LaTeX mode and Markdown (when users embed $...$/$$...$$).
  if (statementPreviewRef.value && statementLatexSource.value) targets.push(statementPreviewRef.value)
  if (solutionPreviewRef.value && solutionLatexSource.value) targets.push(solutionPreviewRef.value)
  if (statementMdPreviewRef.value && statementFormat.value === 'MARKDOWN') targets.push(statementMdPreviewRef.value)
  if (solutionMdPreviewRef.value && (solutionFormat.value || 'MARKDOWN') === 'MARKDOWN')
    targets.push(solutionMdPreviewRef.value)
  if (!targets.length) return
  try {
    await mj.typesetPromise(targets)
  } catch {
    // Best-effort: avoid breaking preview on invalid/incomplete LaTeX while users are editing.
  }
}

/**
 * Clear MathJax readiness retry timer.
 */
function clearMathJaxRetry(): void {
  if (mathjaxRetryTimer !== null) {
    window.clearInterval(mathjaxRetryTimer)
    mathjaxRetryTimer = null
  }
}

/**
 * Retry typesetting after MathJax becomes available (best-effort).
 */
function startMathJaxRetry(): void {
  if (mathjaxRetryTimer !== null) return
  let attempts = 0
  mathjaxRetryTimer = window.setInterval(() => {
    attempts += 1
    if (!typesetPending) {
      clearMathJaxRetry()
      return
    }
    void requestTypesetLatex()
    if (attempts >= 10) {
      clearMathJaxRetry()
    }
  }, 500)
}

/**
 * Request MathJax typesetting; coalesces concurrent calls and retries when MathJax isn't ready.
 */
async function requestTypesetLatex(): Promise<void> {
  typesetPending = true
  if (typesetInFlight) return
  typesetInFlight = true
  try {
    await nextTick()
    await typesetLatex()
    // If MathJax isn't ready yet, typesetLatex() will no-op; keep pending and retry.
    const mj = (window as unknown as { MathJax?: { typesetPromise?: unknown } }).MathJax
    if (mj?.typesetPromise) {
      typesetPending = false
      clearMathJaxRetry()
      return
    }
    startMathJaxRetry()
  } finally {
    typesetInFlight = false
  }
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
	    tagNames.value = normalizeTagNames((detail.tags ?? []).map((t) => t.name))
	    tagsDirty.value = false
	    void requestTypesetLatex()
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
	  await openAiMetaModal('publish')
	}

	/**
	 * Save button click handler: in published status, show AI optimization modal first.
	 */
	async function handleSaveClick(): Promise<void> {
	  if (currentStatus.value === 'PUBLISHED') {
	    await openAiMetaModal('save')
	    return
	  }
	  await handleSave()
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

/**
 * Resolve relative content URLs against the configured API base.
 * @param rawUrl raw URL value
 * @returns resolved URL
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
 * Insert text into a textarea at the current cursor position (best-effort).
 * @param model bound ref-like object
 * @param model.value current text value
 * @param el textarea element
 * @param text inserted text
 */
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

/**
 * Build an image snippet for the current format.
 * @param format target format
 * @param shareUrl public file URL
 * @param alt alt text / filename
 * @returns snippet text
 */
function buildImageSnippet(format: 'MARKDOWN' | 'LATEX', shareUrl: string, alt: string): string {
  if (format === 'LATEX') {
    return `\n\n\\\\includegraphics[width=\\\\linewidth]{${shareUrl}}\n\n`
  }
  const safeAlt = alt.trim() || 'image'
  return `\n\n![${safeAlt}](${shareUrl})\n\n`
}

/**
 * Handle paste event: upload clipboard image and insert a reference snippet.
 * @param event clipboard event
 * @param target editor target
 */
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
    const publicShareUrl = toPublicFileUrl(upload)
    uploadedItems.value = [...uploadedItems.value, { fileId: upload.id, shareUrl: publicShareUrl }]

    const isStatement = target === 'statement'
    const format: 'MARKDOWN' | 'LATEX' = isStatement
      ? statementFormat.value
      : (solutionFormat.value || 'MARKDOWN')

    const snippet = buildImageSnippet(
      format,
      publicShareUrl,
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
  // Try typesetting once on mount; if MathJax isn't ready yet, retry a few times.
  void requestTypesetLatex()

  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeyDown)
  if (previewSyncRaf) window.cancelAnimationFrame(previewSyncRaf)
  if (subjectDebounceTimer) window.clearTimeout(subjectDebounceTimer)
  clearMathJaxRetry()
})

watch(
  [statement, statementFormat, solution, solutionFormat],
  async () => {
    invalidateAiMetaCache()
    await requestTypesetLatex()
    schedulePreviewSync(activeEditor.value)
  },
  { flush: 'post' },
)

	watch(problemId, () => {
	  void loadDetail()
	})

	watch(tagNames, () => {
	  if (!suspendSubjectReset.value) tagsDirty.value = true
	})

	watch(subject, () => {
	  if (!suspendSubjectReset.value) {
	    tagNames.value = []
	  }
	  tagKeyword.value = ''
	  tagMenuOpen.value = false
	  newTagName.value = ''
	  if (subjectDebounceTimer) window.clearTimeout(subjectDebounceTimer)
	  subjectDebounceTimer = window.setTimeout(() => {
	    void loadTaxonomy()
	  }, 300)
	})
</script>

<template>
  <!-- Page: Problem editor -->
  <section class="page page--editor problem-editor">
    <header class="page__header">
      <h1 class="page__title">题目编辑</h1>
    </header>

    <div class="editor__grid">
      <div class="card card--stack problem-editor__panel">
        <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="helper">{{ successMessage }}</p>
        <!-- Meta badges: keep status/share info in a single dense row. -->
        <div v-if="currentStatus || currentShareKey" class="problem-editor__badges">
          <span v-if="currentStatus" class="badge">状态：{{ statusLabels[currentStatus] ?? currentStatus }}</span>
          <span v-if="currentShareKey" class="badge">分享码：{{ currentShareKey }}</span>
        </div>
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
          <p class="helper problem-editor__subjectHint">提示：输入会筛选候选；选中会回填；也可直接输入新学科。</p>
        </label>
        <label class="field">
          <span>难度</span>
          <input v-model.number="difficulty" type="number" min="1" max="5" />
        </label>
        <label class="field">
          <span>可见性</span>
          <SelectCombobox v-model="visibility" :options="visibilityOptions" />
        </label>
        <label class="field">
          <span>标签</span>
          <div class="tag-filter">
            <!-- Tag picker: when closed, show selected tags as multi-line chips for better visibility. -->
            <button class="select-like" :class="{ 'select-like--wrap': !!tagNames.length }" type="button" @click="toggleTagMenu">
              <span v-if="!tagNames.length" class="select-like__value">{{ tagButtonLabel }}</span>
              <span v-else class="tag-filter__summary" aria-label="已选标签">
                <span v-for="name in tagNames" :key="`summary-${name}`" class="tag-pill tag-pill--summary">{{ name }}</span>
              </span>
              <span class="select-like__chevron" aria-hidden="true">▾</span>
            </button>

	            <div v-if="tagMenuOpen" class="tag-filter__menu tag-filter__menu--wide" role="menu">
	              <div class="tag-filter__header">
	                <input v-model="tagKeyword" class="tag-filter__search" type="text" placeholder="搜索标签" />
	                <button class="button button--ghost" type="button" :disabled="!tagNames.length" @click="clearTagFilters">
	                  清空
	                </button>
	                <button class="button" type="button" @click="closeTagMenu">完成</button>
	              </div>

	              <div v-if="tagNames.length" class="tag-filter__selected">
	                <span class="tag-filter__hint">已选</span>
	                <div class="tag-filter__selectedList">
	                  <button
	                    v-for="name in tagNames"
	                    :key="name"
	                    class="tag-pill tag-pill--button"
	                    type="button"
	                    @click="removeTag(name)"
	                    :title="`点击移除：${name}`"
	                  >
	                    {{ name }} ×
	                  </button>
	                </div>
	              </div>

	              <div class="tag-filter__new">
	                <input v-model="newTagName" class="tag-filter__search" type="text" placeholder="新增标签（回车添加）" @keydown.enter.prevent="addCustomTag" />
	                <button class="button button--ghost" type="button" :disabled="!newTagName.trim()" @click="addCustomTag">
	                  添加
	                </button>
	              </div>

	              <div class="tag-filter__list">
	                <label v-for="item in filteredTags" :key="item.id" class="tag-filter__item">
	                  <input v-model="tagNames" type="checkbox" :value="item.name" />
	                  <span>{{ item.name }}</span>
	                </label>
	                <p v-if="!filteredTags.length" class="helper">没有匹配的标签。</p>
	              </div>
	            </div>
	          </div>
	        </label>
        <label class="field">
          <span>题面格式</span>
          <SelectCombobox v-model="statementFormat" :options="statementFormatOptions" />
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
          <SelectCombobox v-model="solutionFormat" :options="solutionFormatOptions" />
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
          <button class="button" :class="{ 'button--busy': busyAction === 'save' }" :disabled="isBusy" @click="handleSaveClick">
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

      <aside ref="previewAsideRef" class="card card--stack preview problem-editor__preview">
        <header class="page__header">
          <div class="preview__headerRow">
            <h2 class="card__title preview__title">实时预览</h2>
            <button class="button button--ghost" type="button" @click="followPreviewScroll = !followPreviewScroll">
              {{ followPreviewScroll ? '跟随：开' : '跟随：关' }}
            </button>
          </div>
          <p class="helper">右侧预览会根据格式选择渲染；LaTeX 依赖 MathJax（若加载失败会回退显示源文本）。</p>
        </header>

        <div class="preview-section">
          <h3 class="card__title">题目预览</h3>
          <div
            v-if="statementFormat === 'LATEX'"
            ref="statementPreviewRef"
            class="preview__content latex"
            v-text="statementLatexSource || statement.trim()"
          ></div>
          <div v-else ref="statementMdPreviewRef" class="preview__content md" v-html="statementPreviewHtml"></div>
        </div>

        <div class="preview-section">
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

	  <!-- Modal: AI metadata recommendations (title/subject/difficulty/tags) -->
	  <div v-if="aiMetaModalOpen" class="modal" @click.self="closeAiMetaModal">
	    <div class="modal__panel card card--stack ai-meta-modal">
	      <header class="page__header">
	        <h2 class="card__title">AI 建议</h2>
	      </header>

	      <p v-if="aiMetaError" class="helper helper--error">{{ aiMetaError }}</p>
	      <p v-else-if="aiMetaLoading" class="helper">正在生成建议...</p>
	      <template v-else>
	        <div v-if="aiMeta" class="ai-meta__card">
	          <div class="ai-meta__row">
	            <span class="ai-meta__label">标题</span>
	            <div class="ai-meta__value">
	              <SelectCombobox v-model="aiTitlePick" :options="aiTitleOptionItems" placeholder="—" :disabled="!aiTitleOptionItems.length" />
	            </div>
	            <div class="ai-meta__apply">
	              <button
	                class="ai-meta__btn ai-meta__btn--accent"
	                type="button"
	                :disabled="!canApplyTitle"
	                @click="applyAiTitle(aiTitlePick)"
	              >
	                应用
	              </button>
	            </div>
	          </div>

	          <div class="ai-meta__row">
	            <span class="ai-meta__label">学科</span>
	            <div class="ai-meta__value">
	              <div v-if="aiMeta.subjectRecommendation?.value" class="ai-meta__main">{{ aiMeta.subjectRecommendation.value }}</div>
	              <div v-else class="ai-meta__empty">—</div>
	            </div>
	            <div class="ai-meta__apply">
	              <button
	                class="ai-meta__btn ai-meta__btn--accent"
	                type="button"
	                :disabled="!canApplySubject"
	                @click="applyAiSubject"
	              >
	                应用
	              </button>
	            </div>
	          </div>

	          <div class="ai-meta__row">
	            <span class="ai-meta__label">难度</span>
	            <div class="ai-meta__value">
	              <div v-if="typeof aiMeta.difficultyRecommendation?.value === 'number'" class="ai-meta__main">
	                {{ aiMeta.difficultyRecommendation.value }}
	              </div>
	              <div v-else class="ai-meta__empty">—</div>
	            </div>
	            <div class="ai-meta__apply">
	              <button
	                class="ai-meta__btn ai-meta__btn--accent"
	                type="button"
	                :disabled="!canApplyDifficulty"
	                @click="applyAiDifficulty"
	              >
	                应用
	              </button>
	            </div>
	          </div>

	          <div class="ai-meta__row">
	            <span class="ai-meta__label">标签</span>
	            <div class="ai-meta__value">
	              <div v-if="aiMeta.tagRecommendations?.add?.length" class="ai-meta__chips">
	                <span class="ai-meta__delta ai-meta__delta--add">+</span>
	                <div class="ai-meta__chipList">
	                  <span v-for="t in aiMeta.tagRecommendations.add" :key="`add-${t}`" class="tag-pill tag-pill--sm">{{ t }}</span>
	                </div>
	              </div>
	              <div v-if="aiMeta.tagRecommendations?.remove?.length" class="ai-meta__chips">
	                <span class="ai-meta__delta ai-meta__delta--remove">−</span>
	                <div class="ai-meta__chipList">
	                  <span v-for="t in aiMeta.tagRecommendations.remove" :key="`rm-${t}`" class="tag-pill tag-pill--sm">{{ t }}</span>
	                </div>
	              </div>
	              <div
	                v-if="!aiMeta.tagRecommendations?.add?.length && !aiMeta.tagRecommendations?.remove?.length"
	                class="ai-meta__empty"
	              >
	                —
	              </div>
	            </div>
	            <div class="ai-meta__apply">
	              <button
	                class="ai-meta__btn ai-meta__btn--accent"
	                type="button"
	                :disabled="!canApplyTags"
	                @click="applyAiTags"
	              >
	                应用
	              </button>
	            </div>
	          </div>
	        </div>
	        <p v-else class="helper">暂无建议结果。</p>
	      </template>

	      <div class="ai-meta__footer">
	        <button
	          class="button button--ghost"
	          type="button"
	          :disabled="!aiMeta || isBusy || !canApplyAll"
	          @click="applyAiAll"
	        >
	          应用全部
	        </button>
	        <button
	          v-if="aiMetaAction === 'publish'"
	          class="button"
	          type="button"
	          :disabled="isBusy"
	          @click="runPublishFlow({ apply: false })"
	        >
	          发布
	        </button>
	        <button
	          v-if="aiMetaAction === 'save'"
	          class="button"
	          type="button"
	          :disabled="isBusy"
	          @click="runSaveFlow({ apply: false })"
	        >
	          保存
	        </button>
	        <button
	          class="button button--ghost"
	          type="button"
	          :disabled="aiMetaLoading || isBusy || !aiMetaAction"
	          @click="refreshAiMeta"
	        >
	          重新生成
	        </button>
	        <button class="button button--ghost" type="button" :disabled="isBusy" @click="closeAiMetaModal">关闭</button>
	      </div>
	    </div>
	  </div>

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
