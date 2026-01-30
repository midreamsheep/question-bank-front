<script setup lang="ts">
/**
 * @file Account layout: user workspace navigation for authenticated pages.
 */
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import UserRightPanel from '../../features/user/presentation/components/UserRightPanel.vue'
import { useLayoutHeaderHeight } from './useLayoutHeaderHeight'

const headerRef = ref<HTMLElement | null>(null)
useLayoutHeaderHeight(headerRef)
</script>

<template>
  <div class="layout layout--app">
    <header ref="headerRef" class="layout__header">
      <RouterLink class="layout__brand" to="/">题目分享站</RouterLink>
      <nav class="layout__nav">
        <RouterLink to="/problems">题目</RouterLink>
        <RouterLink to="/collections">题单</RouterLink>
        <RouterLink to="/daily">每日一题</RouterLink>
        <RouterLink to="/me/problems">我的题目</RouterLink>
        <RouterLink to="/me/collections">我的题单</RouterLink>
      </nav>
      <UserRightPanel />
    </header>
    <main class="layout__content">
      <RouterView />
    </main>
  </div>
</template>
