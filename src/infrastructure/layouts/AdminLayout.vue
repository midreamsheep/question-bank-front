<script setup lang="ts">
/**
 * @file Admin layout: management navigation and container.
 */
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import UserRightPanel from '../../features/user/presentation/components/UserRightPanel.vue'
import { useLayoutHeaderHeight } from './useLayoutHeaderHeight'
import MobileNavDrawer from './MobileNavDrawer.vue'

const headerRef = ref<HTMLElement | null>(null)
useLayoutHeaderHeight(headerRef)

const drawerOpen = ref(false)
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false
  },
)
</script>

<template>
  <!-- Layout: Admin workspace -->
  <div class="layout layout--admin">
    <header ref="headerRef" class="layout__header">
      <button
        class="layout__burger"
        type="button"
        aria-label="打开菜单"
        :aria-expanded="drawerOpen"
        @click="drawerOpen = !drawerOpen"
      >
        ☰
      </button>
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
    <MobileNavDrawer v-model:open="drawerOpen" title="题目分享站管理">
      <template #default="{ close }">
        <RouterLink to="/admin" @click="close">概览</RouterLink>
        <RouterLink to="/admin/problems" @click="close">题目</RouterLink>
        <RouterLink to="/admin/daily" @click="close">每日一题</RouterLink>
        <RouterLink to="/admin/categories" @click="close">分类</RouterLink>
        <RouterLink to="/admin/problem-types" @click="close">题型</RouterLink>
        <RouterLink to="/admin/tags" @click="close">标签</RouterLink>
      </template>
    </MobileNavDrawer>
    <main class="layout__content">
      <RouterView />
    </main>
  </div>
</template>
