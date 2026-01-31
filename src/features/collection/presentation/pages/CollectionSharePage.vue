<script setup lang="ts">
/**
 * @file Collection share page: shareKey access for unlisted collections.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCollectionDi } from '../../di'
import type { CollectionDetail } from '../../domain/models'

const collectionDi = useCollectionDi()
const route = useRoute()

const loading = ref(false)
const errorMessage = ref('')
const detail = ref<CollectionDetail | null>(null)

const shareKey = computed(() => String(route.params.shareKey || ''))

/**
 * Load collection detail by share key.
 */
async function loadDetail(): Promise<void> {
  if (!shareKey.value) {
    errorMessage.value = '分享码无效。'
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    detail.value = await collectionDi.getByShareKeyUseCase.execute(shareKey.value)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载题单失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadDetail()
})

watch(shareKey, () => {
  void loadDetail()
})
</script>

<template>
  <!-- Page: Collection share -->
  <section class="page">
    <header class="page__header">
      <h1 class="page__title">{{ detail?.name ?? '分享题单' }}</h1>
    </header>
    <div class="card card--stack">
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-else-if="loading" class="helper">加载中...</p>
      <template v-else>
        <p class="helper">{{ detail?.description || '暂无描述。' }}</p>
        <ul v-if="detail?.items?.length" class="list">
          <li v-for="item in detail.items" :key="item.problemId" class="list__item">
            <div>
              <strong>{{ item.problem?.title || `题目 ${item.problemId}` }}</strong>
              <p class="helper">排序：{{ item.sortOrder ?? 0 }}</p>
            </div>
            <router-link class="link" :to="`/problems/${item.problemId}`">查看</router-link>
          </li>
        </ul>
        <p v-else class="helper">该题单暂无题目。</p>
      </template>
    </div>
  </section>
</template>
