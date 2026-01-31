<script setup lang="ts">
/**
 * @file Collection list page: browse public collections.
 */
import { onMounted, ref } from 'vue'
import { useCollectionDi } from '../../di'
import type { CollectionSummary, PageResponse } from '../../domain/models'

const collectionDi = useCollectionDi()

const loading = ref(false)
const errorMessage = ref('')
const result = ref<PageResponse<CollectionSummary> | null>(null)

/**
 * Load collections list.
 */
async function loadCollections(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    result.value = await collectionDi.listUseCase.execute({ page: 1, pageSize: 12 })
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载题单失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadCollections()
})
</script>

<template>
  <!-- Page: Collection list -->
  <section class="page collection-list">
    <header class="page__header">
      <h1 class="page__title">题单</h1>
    </header>
    <div class="card card--stack collection-list__panel">
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-else-if="loading" class="helper">加载中...</p>
      <template v-else>
        <ul v-if="result?.items?.length" class="collection-list__list">
          <li v-for="item in result.items" :key="item.id" class="collection-list__item">
            <router-link class="collection-list__link" :to="`/collections/${item.id}`">
              <div class="collection-list__titleRow">
                <strong class="collection-list__title">{{ item.name }}</strong>
                <span class="collection-list__meta">
                  <span class="collection-list__chip">{{ item.itemCount }} 题</span>
                </span>
              </div>
              <span class="collection-list__desc">{{ item.description || '暂无描述。' }}</span>
            </router-link>
          </li>
        </ul>
        <p v-else class="helper">暂无题单。</p>
      </template>
    </div>
  </section>
</template>
