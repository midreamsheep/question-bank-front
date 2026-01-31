<script setup lang="ts">
/**
 * @file Public layout: site header + public navigation container.
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
  <!-- Layout: Public pages -->
  <div class="layout">
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
    <MobileNavDrawer v-model:open="drawerOpen" title="题目分享站">
      <template #default="{ close }">
        <RouterLink to="/problems" @click="close">题目</RouterLink>
        <RouterLink to="/collections" @click="close">题单</RouterLink>
        <RouterLink to="/daily" @click="close">每日一题</RouterLink>
        <RouterLink to="/me/problems" @click="close">我的题目</RouterLink>
        <RouterLink to="/me/collections" @click="close">我的题单</RouterLink>
      </template>
    </MobileNavDrawer>
    <main class="layout__content">
      <RouterView />
    </main>
  </div>
</template>
