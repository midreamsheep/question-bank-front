<script setup lang="ts">
/**
 * @file Admin layout: management navigation and container.
 */
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import UserRightPanel from '../../features/user/presentation/components/UserRightPanel.vue'
import { useLayoutHeaderHeight } from './useLayoutHeaderHeight'

const headerRef = ref<HTMLElement | null>(null)
useLayoutHeaderHeight(headerRef)
</script>

<template>
  <div class="layout layout--admin">
    <header ref="headerRef" class="layout__header">
      <RouterLink class="layout__brand" to="/">题目分享站管理</RouterLink>
      <nav class="layout__nav">
        <RouterLink to="/admin">概览</RouterLink>
        <RouterLink to="/admin/problems">题目</RouterLink>
        <RouterLink to="/admin/daily">每日一题</RouterLink>
        <RouterLink to="/admin/categories">分类</RouterLink>
        <RouterLink to="/admin/problem-types">题型</RouterLink>
        <RouterLink to="/admin/tags">标签</RouterLink>
      </nav>
      <UserRightPanel />
    </header>
    <main class="layout__content">
      <RouterView />
    </main>
  </div>
</template>
