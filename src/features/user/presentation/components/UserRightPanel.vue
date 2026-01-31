<script setup lang="ts">
/**
 * @file Small user panel for layouts (blog-like right side).
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthDi } from '../../../auth/di'
import { useUserDi } from '../../di'
import { useProblemDi } from '../../../problem/di'
import { useCollectionDi } from '../../../collection/di'
import { useFileDi } from '../../../file/di'
import type { UserProfile } from '../../domain/models'
import { HttpError } from '../../../../infrastructure/http'
import { toPublicFileUrl } from '../../../file/presentation/utils/fileShareUrl'

const userDi = useUserDi()
const authDi = useAuthDi()
const problemDi = useProblemDi()
const collectionDi = useCollectionDi()
const fileDi = useFileDi()
const router = useRouter()

const loading = ref(false)
const me = ref<UserProfile | null>(null)
const avatarUrl = ref('')
const menuOpen = ref(false)
const statsLoading = ref(false)
const statsLoaded = ref(false)
const statsError = ref('')
const myProblemTotal = ref<number | null>(null)
const myCollectionTotal = ref<number | null>(null)

const displayName = computed(() => {
  const profile = me.value
  if (!profile) return ''
  return profile.nickname?.trim() || profile.username
})

const initials = computed(() => {
  const name = displayName.value.trim()
  if (!name) return '?'
  return name.slice(0, 1).toUpperCase()
})

/**
 * Resolve avatar URL from profile.avatarFileId (best-effort).
 * @param profile - User profile (nullable).
 * @returns Promise resolved after avatar is resolved.
 */
async function loadAvatar(profile: UserProfile | null): Promise<void> {
  avatarUrl.value = ''
  const fileId = profile?.avatarFileId?.trim?.() ? String(profile.avatarFileId).trim() : ''
  if (!fileId) return
  try {
    const result = await fileDi.shareKeyUseCase.execute({ fileId })
    avatarUrl.value = toPublicFileUrl({ shareKey: result.shareKey })
  } catch {
    // Best-effort: fall back to initials.
    avatarUrl.value = ''
  }
}

/**
 * Load current user profile for the panel and reset derived stats.
 * @returns Promise resolved when loading completes.
 */
async function loadMe(): Promise<void> {
  loading.value = true
  try {
    me.value = await userDi.getMeUseCase.execute()
    await loadAvatar(me.value)
    // Profile may change after login/logout; keep stats fresh per session.
    statsLoaded.value = false
    myProblemTotal.value = null
    myCollectionTotal.value = null
    statsError.value = ''
  } catch (error) {
    // If token is invalid/expired, force re-login.
    if (error instanceof HttpError && error.status === 401) {
      authDi.sessionStorage.clear()
      await router.replace({ path: '/login', query: { reason: 'logout' } })
      return
    }
    me.value = null
  } finally {
    loading.value = false
  }
}

/**
 * Logout current user and redirect to login page.
 * @returns Promise resolved after navigation.
 */
async function handleLogout(): Promise<void> {
  try {
    await authDi.logoutUseCase.execute()
  } catch {
    // Ignore logout errors; token will be discarded anyway.
  } finally {
    authDi.sessionStorage.clear()
    await router.push({ path: '/login', query: { reason: 'logout' } })
  }
}

/**
 * Load lightweight stats (problem count / collection count) once per open session.
 * @returns Promise resolved when stats load finishes.
 */
async function loadStats(): Promise<void> {
  if (statsLoading.value) return
  if (statsLoaded.value) return
  statsLoading.value = true
  statsError.value = ''
  try {
    const [problems, collections] = await Promise.all([
      problemDi.listMineUseCase.execute({ page: 1, pageSize: 1 }),
      collectionDi.listMineUseCase.execute({ page: 1, pageSize: 1 }),
    ])
    myProblemTotal.value = problems.total
    myCollectionTotal.value = collections.total
    statsLoaded.value = true
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载统计失败。'
    statsError.value = message
  } finally {
    statsLoading.value = false
  }
}

/**
 * Navigate to a path and close the menu.
 * @param path - Router target path.
 */
function go(path: string): void {
  closeMenu()
  void router.push(path)
}

/**
 * Toggle user menu open state.
 */
function toggleMenu(): void {
  if (loading.value) return
  menuOpen.value = !menuOpen.value
  if (menuOpen.value) void loadStats()
}

/**
 * Close user menu.
 */
function closeMenu(): void {
  menuOpen.value = false
}

/**
 * Close menu when clicking outside the panel.
 * @param event - Document click event.
 */
function onDocumentClick(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (target.closest('.user-panel') === null) {
    closeMenu()
  }
}

/**
 * Close menu on Escape key.
 * @param event - Keyboard event.
 */
function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') closeMenu()
}

/**
 * Update in-memory profile when an external profile update event is emitted.
 * @param event - Custom event with `UserProfile` detail.
 */
function onMeUpdated(event: Event): void {
  const e = event as CustomEvent<UserProfile>
  if (!e.detail) return
  me.value = e.detail
  void loadAvatar(me.value)
  // Stats are derived; consider them stale after profile updates that might affect routing.
  statsLoaded.value = false
}

onMounted(() => {
  void loadMe()
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeyDown)
  window.addEventListener('vf:me-updated', onMeUpdated as EventListener)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('vf:me-updated', onMeUpdated as EventListener)
})
</script>

<template>
  <!-- Component: user panel (chip + menu) -->
  <div class="user-panel">
    <button class="user-panel__chip" type="button" :disabled="loading" @click="toggleMenu">
      <span class="user-panel__avatar" aria-hidden="true">
        <img v-if="avatarUrl" class="user-panel__avatarImg" :src="avatarUrl" alt="" />
        <span v-else class="user-panel__avatarText">{{ initials }}</span>
      </span>
      <span class="user-panel__name">
        <span v-if="loading">加载中...</span>
        <span v-else>{{ displayName || '未登录' }}</span>
      </span>
      <span class="user-panel__chevron" aria-hidden="true">▾</span>
    </button>

    <div v-if="menuOpen" class="user-panel__menu" role="menu">
      <div class="user-panel__meta" v-if="me">
        <div class="user-panel__metaHeader">
          <span class="user-panel__metaAvatar" aria-hidden="true">
            <img v-if="avatarUrl" class="user-panel__avatarImg" :src="avatarUrl" alt="" />
            <span v-else class="user-panel__avatarText">{{ initials }}</span>
          </span>
          <div>
            <p class="user-panel__metaTitle">{{ displayName }}</p>
            <p class="user-panel__metaText">ID：{{ me.id }}</p>
          </div>
        </div>

        <div class="user-panel__stats">
          <button class="user-panel__stat" type="button" @click="go('/me/problems')">
            <span class="user-panel__statLabel">我的题目</span>
            <span class="user-panel__statValue">{{ statsLoading ? '…' : (myProblemTotal ?? '-') }}</span>
          </button>
          <button class="user-panel__stat" type="button" @click="go('/me/collections')">
            <span class="user-panel__statLabel">我的题单</span>
            <span class="user-panel__statValue">{{ statsLoading ? '…' : (myCollectionTotal ?? '-') }}</span>
          </button>
        </div>
        <p v-if="statsError" class="user-panel__metaText">{{ statsError }}</p>
      </div>
      <div class="user-panel__actions">
        <button class="user-panel__item" type="button" @click="go('/me/profile')">账号</button>
        <button class="user-panel__item user-panel__item--danger" type="button" @click="closeMenu(); void handleLogout()">退出登录</button>
      </div>
    </div>
  </div>
</template>
