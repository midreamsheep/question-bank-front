<script setup lang="ts">
/**
 * @file Home page: MVP overview and entry points.
 */
import { onMounted, ref } from 'vue'
import { useSystemDi } from '../../../system/di'

const systemDi = useSystemDi()
const healthStatus = ref<'checking' | 'ok' | 'down'>('checking')

/**
 * Check backend health.
 */
async function checkHealth(): Promise<void> {
  healthStatus.value = 'checking'
  try {
    const result = await systemDi.checkHealthUseCase.execute()
    healthStatus.value = result.ok ? 'ok' : 'down'
  } catch {
    healthStatus.value = 'down'
  }
}

onMounted(() => {
  void checkHealth()
})
</script>

<template>
  <section class="page">
    <header class="page__header">
      <h1 class="page__title">数学物理题目分享站</h1>
    </header>
    <div class="page__grid">
      <article class="card">
        <h2 class="card__title">快速入口</h2>
        <p class="card__text">按学科、分类与题型快速浏览。</p>
      </article>
      <article class="card">
        <h2 class="card__title">最新题目</h2>
        <p class="card__text">展示最近发布的题目列表。</p>
      </article>
      <article class="card">
        <h2 class="card__title">服务状态</h2>
        <p class="card__text">
          <span v-if="healthStatus === 'checking'">检测中...</span>
          <span v-else-if="healthStatus === 'ok'">服务正常。</span>
          <span v-else>服务不可用。</span>
        </p>
      </article>
    </div>
  </section>
</template>
