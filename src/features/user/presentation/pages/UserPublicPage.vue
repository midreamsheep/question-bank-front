<script setup lang="ts">
/**
 * @file Public user page: show author's public problems and collections.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserDi } from '../../di'
import { useProblemDi } from '../../../problem/di'
import { useCollectionDi } from '../../../collection/di'
import { useFileDi } from '../../../file/di'
import type { UserProfile } from '../../domain/models'
import type { ProblemSummary, PageResponse as ProblemPageResponse } from '../../../problem/domain/models'
import type { CollectionSummary, PageResponse as CollectionPageResponse } from '../../../collection/domain/models'

const route = useRoute()
const userDi = useUserDi()
const problemDi = useProblemDi()
const collectionDi = useCollectionDi()
const fileDi = useFileDi()

const userId = computed(() => {
  const raw = route.params.id
  if (typeof raw === 'string' && raw.trim()) return raw
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].trim()) return raw[0]
  return null
})

const loading = ref(false)
const errorMessage = ref('')
const profile = ref<UserProfile | null>(null)
const avatarUrl = ref('')

const problemsLoading = ref(false)
const problemsError = ref('')
const problems = ref<ProblemSummary[]>([])
const problemsPage = ref(1)
const problemsTotal = ref(0)
const problemsHasMore = computed(() => problems.value.length < problemsTotal.value)

const collectionsLoading = ref(false)
const collectionsError = ref('')
const collections = ref<CollectionSummary[]>([])
const collectionsPage = ref(1)
const collectionsTotal = ref(0)
const collectionsHasMore = computed(() => collections.value.length < collectionsTotal.value)

const displayName = computed(() => {
  const p = profile.value
  if (!p) return userId.value ? `用户 ${userId.value}` : '用户'
  return p.nickname?.trim() || p.username || `用户 ${p.id}`
})

const initials = computed(() => {
  const name = displayName.value.trim()
  if (!name) return '?'
  return name.slice(0, 1).toUpperCase()
})

async function loadAvatar(next: UserProfile | null): Promise<void> {
  avatarUrl.value = ''
  const fileId = next?.avatarFileId?.trim?.() ? String(next.avatarFileId).trim() : ''
  if (!fileId) return
  try {
    const res = await fileDi.presignedUrlUseCase.execute({ fileId, expiresSeconds: 3600 })
    avatarUrl.value = res.url
  } catch {
    avatarUrl.value = ''
  }
}

async function loadProfile(): Promise<void> {
  if (!userId.value) {
    errorMessage.value = '用户ID无效。'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    profile.value = await userDi.getByIdUseCase.execute(userId.value)
    await loadAvatar(profile.value)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载作者信息失败。'
    errorMessage.value = message
    profile.value = null
    avatarUrl.value = ''
  } finally {
    loading.value = false
  }
}

async function loadProblems(reset = false): Promise<void> {
  if (!userId.value) return
  if (problemsLoading.value) return
  problemsLoading.value = true
  problemsError.value = ''
  try {
    const page = reset ? 1 : problemsPage.value
    const data: ProblemPageResponse<ProblemSummary> = await problemDi.listUseCase.execute({
      authorId: userId.value,
      status: 'PUBLISHED',
      page,
      pageSize: 20,
    })
    problemsTotal.value = data.total
    if (reset) {
      problems.value = data.items
      problemsPage.value = 2
    } else {
      problems.value = [...problems.value, ...data.items]
      problemsPage.value = page + 1
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载作者题目失败。'
    problemsError.value = message
  } finally {
    problemsLoading.value = false
  }
}

async function loadCollections(reset = false): Promise<void> {
  if (!userId.value) return
  if (collectionsLoading.value) return
  collectionsLoading.value = true
  collectionsError.value = ''
  try {
    const page = reset ? 1 : collectionsPage.value
    const data: CollectionPageResponse<CollectionSummary> = await collectionDi.listUseCase.execute({
      authorId: userId.value,
      status: 'ACTIVE',
      page,
      pageSize: 20,
    })
    collectionsTotal.value = data.total
    if (reset) {
      collections.value = data.items
      collectionsPage.value = 2
    } else {
      collections.value = [...collections.value, ...data.items]
      collectionsPage.value = page + 1
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载作者题单失败。'
    collectionsError.value = message
  } finally {
    collectionsLoading.value = false
  }
}

async function loadAll(): Promise<void> {
  await loadProfile()
  await Promise.all([loadProblems(true), loadCollections(true)])
}

onMounted(() => {
  void loadAll()
})

watch(userId, () => {
  profile.value = null
  avatarUrl.value = ''
  problems.value = []
  problemsPage.value = 1
  problemsTotal.value = 0
  collections.value = []
  collectionsPage.value = 1
  collectionsTotal.value = 0
  void loadAll()
})
</script>

<template>
  <section class="page page--narrow">
    <header class="page__header">
      <h1 class="page__title">{{ displayName }}</h1>
      <p class="helper">作者主页</p>
    </header>

    <div class="card card--stack">
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-else-if="loading" class="helper">加载中...</p>
      <template v-else>
        <div class="author-card author-card--hero">
          <div class="author-card__avatar" aria-hidden="true">
            <img v-if="avatarUrl" :src="avatarUrl" alt="" />
            <span v-else class="author-card__initial">{{ initials }}</span>
          </div>
          <div class="author-card__body">
            <div class="author-card__titleRow">
              <h2 class="author-card__name">{{ displayName }}</h2>
              <span class="author-card__id" v-if="profile?.id">ID：{{ profile.id }}</span>
            </div>
            <div class="author-card__stats">
              <div class="author-card__stat">
                <span class="author-card__statLabel">公开题目</span>
                <span class="author-card__statValue">{{ problemsTotal }}</span>
              </div>
              <div class="author-card__stat">
                <span class="author-card__statLabel">公开题单</span>
                <span class="author-card__statValue">{{ collectionsTotal }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="card card--stack">
      <header class="page__header">
        <h2 class="card__title">公开题目</h2>
        <p class="helper">共 {{ problemsTotal }} 题</p>
      </header>
      <p v-if="problemsError" class="helper helper--error">{{ problemsError }}</p>
      <p v-else-if="problemsLoading && !problems.length" class="helper">加载中...</p>
      <template v-else>
        <ul v-if="problems.length" class="list">
          <li v-for="p in problems" :key="p.id" class="list__item">
            <div>
              <router-link class="link" :to="`/problems/${p.id}`">{{ p.title }}</router-link>
              <p class="helper">学科：{{ p.subject }} · 难度：{{ p.difficulty }}</p>
              <div v-if="p.tags?.length" class="tag-row">
                <span v-for="t in p.tags" :key="t.id" class="tag-pill">{{ t.name }}</span>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="helper">暂无公开题目。</p>
        <div class="actions" v-if="problemsHasMore">
          <button class="button button--ghost" :class="{ 'button--busy': problemsLoading }" :disabled="problemsLoading" @click="loadProblems(false)">
            {{ problemsLoading ? '加载中...' : '加载更多' }}
          </button>
        </div>
      </template>
    </div>

    <div class="card card--stack">
      <header class="page__header">
        <h2 class="card__title">公开题单</h2>
        <p class="helper">共 {{ collectionsTotal }} 个</p>
      </header>
      <p v-if="collectionsError" class="helper helper--error">{{ collectionsError }}</p>
      <p v-else-if="collectionsLoading && !collections.length" class="helper">加载中...</p>
      <template v-else>
        <ul v-if="collections.length" class="list">
          <li v-for="c in collections" :key="c.id" class="list__item">
            <div>
              <router-link class="link" :to="`/collections/${c.id}`">{{ c.name }}</router-link>
              <p class="helper">题目数：{{ c.itemCount }}</p>
            </div>
          </li>
        </ul>
        <p v-else class="helper">暂无公开题单。</p>
        <div class="actions" v-if="collectionsHasMore">
          <button class="button button--ghost" :class="{ 'button--busy': collectionsLoading }" :disabled="collectionsLoading" @click="loadCollections(false)">
            {{ collectionsLoading ? '加载中...' : '加载更多' }}
          </button>
        </div>
      </template>
    </div>
  </section>
</template>

