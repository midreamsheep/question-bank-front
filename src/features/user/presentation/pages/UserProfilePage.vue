<script setup lang="ts">
/**
 * @file User profile page: overview + stats + entry points.
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthDi } from '../../../auth/di'
import { useUserDi } from '../../di'
import type { UserProfile, UserStats } from '../../domain/models'

const authDi = useAuthDi()
const userDi = useUserDi()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const me = ref<UserProfile | null>(null)
const stats = ref<UserStats | null>(null)
const loggingOut = ref(false)

/**
 * Load current profile and stats for the page.
 * @returns Promise resolved when loading completes.
 */
async function loadData(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const [profile, currentStats] = await Promise.all([
      userDi.getMeUseCase.execute(),
      userDi.getStatsUseCase.execute(),
    ])
    me.value = profile
    stats.value = currentStats
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载用户信息失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

/**
 * Logout current user and redirect to login page.
 * @returns Promise resolved after navigation.
 */
async function handleLogout(): Promise<void> {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await authDi.logoutUseCase.execute()
  } catch {
    // Ignore logout errors; backend is stateless and token will be discarded anyway.
  } finally {
    authDi.sessionStorage.clear()
    await router.push({ path: '/login', query: { reason: 'logout' } })
    loggingOut.value = false
  }
}

onMounted(() => {
  void loadData()
})
</script>

<template>
  <!-- Page: Profile -->
  <section class="page page--narrow">
    <header class="page__header">
      <h1 class="page__title">账号</h1>
    </header>
    <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
    <p v-else-if="loading" class="helper">加载中...</p>
    <template v-else>
      <div class="card card--stack">
        <div class="actions">
          <router-link class="button" to="/me/profile/edit">编辑资料</router-link>
          <router-link class="button button--ghost" to="/me/profile/password">修改密码</router-link>
          <button class="button button--ghost" :class="{ 'button--busy': loggingOut }" :disabled="loggingOut" @click="handleLogout">
            {{ loggingOut ? '退出中...' : '退出登录' }}
          </button>
        </div>
        <div v-if="me" class="card card--stack">
          <div>
            <h2 class="card__title">基本信息</h2>
            <p class="helper">用户名：{{ me.username }}</p>
            <p class="helper">用户ID：{{ me.id }}</p>
            <p class="helper">状态：{{ me.status }}</p>
          </div>
          <div>
            <h2 class="card__title">公开展示</h2>
            <p class="helper">昵称：{{ me.nickname || '未设置' }}</p>
            <p class="helper">头像文件ID：{{ me.avatarFileId ?? '未设置' }}</p>
          </div>
        </div>
      </div>

      <div class="card card--stack">
        <h2 class="card__title">我的数据</h2>
        <div class="page__grid">
          <router-link class="card card--stack" to="/me/problems">
            <h3 class="card__title">我的题目</h3>
            <p class="helper">草稿：{{ stats?.problemCountByStatus.DRAFT ?? 0 }}</p>
            <p class="helper">已发布：{{ stats?.problemCountByStatus.PUBLISHED ?? 0 }}</p>
            <p class="helper">已下架：{{ stats?.problemCountByStatus.DISABLED ?? 0 }}</p>
          </router-link>
          <router-link class="card card--stack" to="/me/collections">
            <h3 class="card__title">我的题单</h3>
            <p class="helper">题单数：{{ stats?.collectionCount ?? 0 }}</p>
          </router-link>
        </div>
      </div>
    </template>
  </section>
</template>
