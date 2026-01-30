<script setup lang="ts">
/**
 * @file Problem detail page: statement and solution view.
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProblemDi } from '../../di'
import { useCommentDi } from '../../../comment/di'
import { useUserDi } from '../../../user/di'
import { useFileDi } from '../../../file/di'
import type { ProblemDetail } from '../../domain/models'
import type { PageResponse, ProblemComment } from '../../../comment/domain/models'
import { runtimeConfig } from '../../../../infrastructure/config'
import { escapeHtml, renderMarkdown } from '../utils/markdown'

const problemDi = useProblemDi()
const commentDi = useCommentDi()
const userDi = useUserDi()
const fileDi = useFileDi()
const route = useRoute()

const loading = ref(false)
const errorMessage = ref('')
const detail = ref<ProblemDetail | null>(null)

const commentsLoading = ref(false)
const commentsError = ref('')
const comments = ref<PageResponse<ProblemComment> | null>(null)
const newComment = ref('')
const commenting = ref(false)

const authorLoading = ref(false)
const authorAvatarUrl = ref('')

const statementRef = ref<HTMLElement | null>(null)
const solutionRef = ref<HTMLElement | null>(null)
const statementMdRef = ref<HTMLElement | null>(null)
const solutionMdRef = ref<HTMLElement | null>(null)

const formatLabels: Record<string, string> = {
  MARKDOWN: 'Markdown',
  LATEX: 'LaTeX',
}

function formatContentType(value?: string | null): string {
  if (!value) return '无'
  return formatLabels[value] ?? value
}

const problemId = computed(() => {
  const raw = route.params.id
  if (typeof raw === 'string' && raw.trim()) return raw
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].trim()) return raw[0]
  return null
})

const authorLabel = computed(() => {
  const author = detail.value?.author
  if (!author) return '未知'
  if (author.displayName && author.displayName.trim()) return author.displayName
  if (author.nickname && author.nickname.trim()) return author.nickname
  if (author.id) return `用户 ${author.id}`
  return '未知'
})

const authorId = computed(() => detail.value?.author?.id?.trim?.() ? String(detail.value?.author?.id).trim() : '')

const authorInitial = computed(() => {
  const name = authorLabel.value.trim()
  if (!name) return '?'
  return name.slice(0, 1).toUpperCase()
})

async function loadAuthorMeta(): Promise<void> {
  authorAvatarUrl.value = ''

  if (!authorId.value) return

  authorLoading.value = true
  try {
    // Best-effort: load avatarFileId.
    const profile = await userDi.getByIdUseCase.execute(authorId.value)
    const fileId = profile.avatarFileId?.trim?.() ? String(profile.avatarFileId).trim() : ''
    if (fileId) {
      try {
        const res = await fileDi.presignedUrlUseCase.execute({ fileId, expiresSeconds: 3600 })
        authorAvatarUrl.value = res.url
      } catch {
        authorAvatarUrl.value = ''
      }
    }
  } catch {
    // Best-effort: fall back to initials.
    authorAvatarUrl.value = ''
  } finally {
    authorLoading.value = false
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

function wrapLatexDisplay(source: string): string {
  const trimmed = source.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('\\[') || trimmed.startsWith('$$')) return trimmed
  return `\\\\[${trimmed}\\\\]`
}

const statementHtml = computed(() => {
  const content = detail.value?.statement?.trim() ?? ''
  if (!content) return '<p class="helper">暂无内容。</p>'
  if (detail.value?.statementFormat === 'MARKDOWN') {
    return renderMarkdown(content, { resolveUrl: resolveContentUrl, resolveImageUrl: resolveContentUrl })
  }
  return `<pre class="md__pre"><code>${escapeHtml(content)}</code></pre>`
})

const solutionHtml = computed(() => {
  const raw = detail.value?.solution ?? ''
  const content = raw?.trim?.() ? String(raw).trim() : ''
  if (!content) return '<p class="helper">暂无解答。</p>'
  const format = detail.value?.solutionFormat ?? 'MARKDOWN'
  if (format === 'MARKDOWN') {
    return renderMarkdown(content, { resolveUrl: resolveContentUrl, resolveImageUrl: resolveContentUrl })
  }
  return `<pre class="md__pre"><code>${escapeHtml(content)}</code></pre>`
})

const statementLatexSource = computed(() => {
  if (!detail.value || detail.value.statementFormat !== 'LATEX') return ''
  return wrapLatexDisplay(detail.value.statement ?? '')
})

const solutionLatexSource = computed(() => {
  if (!detail.value || detail.value.solutionFormat !== 'LATEX') return ''
  return wrapLatexDisplay(detail.value.solution ?? '')
})

async function typesetLatex(): Promise<void> {
  const mj = (window as unknown as { MathJax?: { typesetPromise?: (elements?: unknown[]) => Promise<void> } })
    .MathJax
  if (!mj?.typesetPromise) return
  const targets: HTMLElement[] = []
  if (statementRef.value && statementLatexSource.value) targets.push(statementRef.value)
  if (solutionRef.value && solutionLatexSource.value) targets.push(solutionRef.value)
  if (statementMdRef.value && detail.value?.statementFormat === 'MARKDOWN') targets.push(statementMdRef.value)
  if (solutionMdRef.value && (detail.value?.solutionFormat ?? 'MARKDOWN') === 'MARKDOWN')
    targets.push(solutionMdRef.value)
  if (!targets.length) return
  await mj.typesetPromise(targets)
}

/**
 * Load problem detail by id.
 */
async function loadProblem(): Promise<void> {
  if (!problemId.value) {
    errorMessage.value = '题目ID无效。'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    detail.value = await problemDi.getDetailUseCase.execute(problemId.value)
    await nextTick()
    await typesetLatex()
    void loadAuthorMeta()
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载题目失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

async function loadComments(): Promise<void> {
  if (!problemId.value) return
  commentsLoading.value = true
  commentsError.value = ''
  try {
    comments.value = await commentDi.listUseCase.execute({
      problemId: problemId.value,
      parentId: null,
      page: 1,
      pageSize: 50,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载评论失败。'
    commentsError.value = message
  } finally {
    commentsLoading.value = false
  }
}

async function handleCreateComment(): Promise<void> {
  if (!problemId.value) {
    commentsError.value = '题目ID无效。'
    return
  }
  const content = newComment.value.trim()
  if (!content) {
    commentsError.value = '评论内容不能为空。'
    return
  }
  if (content.length > 500) {
    commentsError.value = '评论长度不能超过 500。'
    return
  }

  commenting.value = true
  commentsError.value = ''
  try {
    await commentDi.createUseCase.execute({
      problemId: problemId.value,
      parentId: null,
      replyToCommentId: null,
      content,
    })
    newComment.value = ''
    await loadComments()
  } catch (error) {
    const message = error instanceof Error ? error.message : '发表评论失败。'
    commentsError.value = message
  } finally {
    commenting.value = false
  }
}

onMounted(() => {
  void loadProblem()
  void loadComments()
})

watch(problemId, () => {
  void loadProblem()
  void loadComments()
})

watch([statementLatexSource, solutionLatexSource], async () => {
  await nextTick()
  await typesetLatex()
})
</script>

<template>
  <section class="page">
    <header class="page__header">
      <h1 class="page__title">{{ detail?.title ?? '题目' }}</h1>
      <div v-if="detail" class="problem-head__meta">
        <div class="author-chip" title="作者">
          <span class="author-chip__avatar" aria-hidden="true">
            <img v-if="authorAvatarUrl" :src="authorAvatarUrl" alt="" />
            <span v-else class="author-chip__initial">{{ authorInitial }}</span>
          </span>
          <span class="author-chip__name">{{ authorLabel }}</span>
          <span v-if="authorLoading" class="author-chip__loading">…</span>
        </div>

        <div class="problem-chips" title="题目信息">
          <span class="meta-chip">学科：{{ detail.subject }}</span>
          <span class="meta-chip">难度：{{ detail.difficulty }}</span>
          <span v-if="detail.tags?.length" class="meta-chip meta-chip--tags">
            <span class="meta-chip__label">标签：</span>
            <span class="tag-row">
              <span v-for="t in detail.tags" :key="t.id" class="tag-pill">{{ t.name }}</span>
            </span>
          </span>
        </div>
      </div>
    </header>
    <div class="card card--stack">
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-else-if="loading" class="helper">加载中...</p>
      <template v-else>
        <div>
          <h2 class="card__title">题目描述</h2>
          <div
            v-if="detail?.statementFormat === 'LATEX'"
            ref="statementRef"
            class="preview__content latex"
            v-text="statementLatexSource || detail?.statement?.trim?.() || ''"
          ></div>
          <div v-else ref="statementMdRef" class="preview__content md" v-html="statementHtml"></div>
        </div>
        <div>
          <h2 class="card__title">解答（{{ formatContentType(detail?.solutionFormat) }}）</h2>
          <p v-if="!detail?.solutionFormat" class="helper">暂无解答。</p>
          <div
            v-else-if="detail?.solutionFormat === 'LATEX'"
            ref="solutionRef"
            class="preview__content latex"
            v-text="solutionLatexSource || detail?.solution?.trim?.() || ''"
          ></div>
          <div v-else ref="solutionMdRef" class="preview__content md" v-html="solutionHtml"></div>
        </div>
      </template>
    </div>

    <div class="card card--stack">
      <header class="page__header">
        <h2 class="card__title">评论区</h2>
        <p class="helper">仅登录用户可评论。</p>
      </header>

      <p v-if="commentsError" class="helper helper--error">{{ commentsError }}</p>
      <p v-else-if="commentsLoading" class="helper">加载评论中...</p>
      <template v-else>
        <ul v-if="comments?.items?.length" class="list">
          <li v-for="item in comments.items" :key="item.id" class="list__item">
            <div>
              <strong>用户 {{ item.userId }}</strong>
              <p class="helper">{{ item.createdAt }}</p>
              <p class="card__text">{{ item.deleted ? '该评论已删除。' : (item.content ?? '') }}</p>
              <p class="helper">点赞：{{ item.likeCount }}</p>
            </div>
          </li>
        </ul>
        <p v-else class="helper">还没有评论，来抢沙发吧。</p>
      </template>

      <div class="card card--stack">
        <label class="field">
          <span>发表评论</span>
          <textarea v-model="newComment" rows="3" placeholder="写下你的想法（最多 500 字）"></textarea>
        </label>
        <div class="actions">
          <button class="button" :class="{ 'button--busy': commenting }" :disabled="commenting" @click="handleCreateComment">
            {{ commenting ? '发布中...' : '发布' }}
          </button>
          <button class="button button--ghost" type="button" :class="{ 'button--busy': commentsLoading }" :disabled="commentsLoading" @click="loadComments">
            {{ commentsLoading ? '刷新中...' : '刷新' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
