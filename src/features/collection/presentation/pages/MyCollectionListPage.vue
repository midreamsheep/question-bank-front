<script setup lang="ts">
/**
 * @file My collections page: manage personal collections.
 */
import { computed, onMounted, ref } from 'vue'
import { useCollectionDi } from '../../di'
import type { CollectionSummary, PageResponse } from '../../domain/models'

const collectionDi = useCollectionDi()

const loading = ref(false)
const errorMessage = ref('')
const result = ref<PageResponse<CollectionSummary> | null>(null)
const sharing = ref<{ name: string; shareKey: string } | null>(null)
const rowBusy = ref<{ id: string; action: 'delete' | 'share' } | null>(null)
const copying = ref(false)
const copied = ref(false)
const page = ref(1)
const pageSize = ref(12)

const totalPages = computed(() => {
  const total = result.value?.total ?? 0
  return total > 0 ? Math.ceil(total / pageSize.value) : 1
})
const canPrev = computed(() => page.value > 1)
const canNext = computed(() => page.value < totalPages.value)

/**
 * Load collections for current user.
 */
async function loadCollections(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    result.value = await collectionDi.listMineUseCase.execute({ page: page.value, pageSize: pageSize.value })
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载题单失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

async function handleDelete(item: CollectionSummary): Promise<void> {
  const ok = window.confirm('确定删除该题单吗？此操作不可恢复。')
  if (!ok) return
  rowBusy.value = { id: item.id, action: 'delete' }
  errorMessage.value = ''
  try {
    await collectionDi.deleteUseCase.execute(item.id)
    await loadCollections()
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除题单失败。'
    errorMessage.value = message
  } finally {
    if (rowBusy.value?.id === item.id && rowBusy.value.action === 'delete') rowBusy.value = null
  }
}

const shareLink = computed(() => {
  if (!sharing.value) return ''
  return `${window.location.origin}/collections/share/${sharing.value.shareKey}`
})

async function handleCopyShareLink(): Promise<void> {
  if (!shareLink.value) return
  copying.value = true
  copied.value = false
  try {
    await navigator.clipboard.writeText(shareLink.value)
    copied.value = true
  } catch {
    window.prompt('复制分享链接：', shareLink.value)
  } finally {
    copying.value = false
    window.setTimeout(() => {
      copied.value = false
    }, 1200)
  }
}

async function handleShare(item: CollectionSummary): Promise<void> {
  rowBusy.value = { id: item.id, action: 'share' }
  errorMessage.value = ''
  try {
    const detail = await collectionDi.getDetailUseCase.execute(item.id)
    if (!detail.shareKey) {
      errorMessage.value = '该题单暂无分享码（可能不是 UNLISTED）。'
      return
    }
    sharing.value = { name: item.name, shareKey: detail.shareKey }
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载分享信息失败。'
    errorMessage.value = message
  } finally {
    if (rowBusy.value?.id === item.id && rowBusy.value.action === 'share') rowBusy.value = null
  }
}

onMounted(() => {
  void loadCollections()
})
</script>

<template>
  <section class="page">
    <header class="page__header">
      <h1 class="page__title">我的题单</h1>
    </header>
    <div class="card card--stack">
      <div class="actions">
        <router-link class="button" to="/me/collections/new">新建题单</router-link>
      </div>
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-else-if="loading" class="helper">加载中...</p>
      <template v-else>
        <p class="helper">
          共 {{ result?.total ?? 0 }} 条，当前第 {{ result?.page ?? 1 }} 页 / {{ totalPages }} 页
        </p>
        <ul v-if="result?.items?.length" class="list">
          <li v-for="item in result.items" :key="item.id" class="list__item">
            <div>
              <strong>{{ item.name }}</strong>
              <p class="helper">
                {{ item.description || '暂无描述。' }}
                · 可见性：{{ item.visibility }}
                · 状态：{{ item.status }}
                · 题目数：{{ item.itemCount }}
              </p>
            </div>
            <div class="actions">
              <router-link class="button button--ghost" :to="`/me/collections/${item.id}/edit`">编辑</router-link>
              <button
                v-if="item.visibility === 'UNLISTED'"
                class="button button--ghost"
                type="button"
                :class="{ 'button--busy': rowBusy?.id === item.id && rowBusy?.action === 'share' }"
                :disabled="rowBusy?.id === item.id"
                @click="handleShare(item)"
              >
                {{ rowBusy?.id === item.id && rowBusy?.action === 'share' ? '加载中...' : '分享' }}
              </button>
              <button
                class="button button--ghost"
                type="button"
                :class="{ 'button--busy': rowBusy?.id === item.id && rowBusy?.action === 'delete' }"
                :disabled="rowBusy?.id === item.id"
                @click="handleDelete(item)"
              >
                {{ rowBusy?.id === item.id && rowBusy?.action === 'delete' ? '删除中...' : '删除' }}
              </button>
            </div>
          </li>
        </ul>
        <p v-else class="helper">还没有创建题单。</p>

        <div class="actions">
          <button
            class="button button--ghost"
            type="button"
            :disabled="!canPrev"
            @click="page -= 1; void loadCollections()"
          >
            上一页
          </button>
          <button
            class="button button--ghost"
            type="button"
            :disabled="!canNext"
            @click="page += 1; void loadCollections()"
          >
            下一页
          </button>
        </div>
      </template>
    </div>

    <div v-if="sharing" class="modal" @click.self="sharing = null">
      <div class="modal__panel card card--stack">
        <h2 class="card__title">分享题单</h2>
        <p class="helper">题单：{{ sharing.name }}</p>
        <p class="helper">链接（需要登录后访问）：</p>
        <p class="card__text">{{ shareLink }}</p>
        <div class="actions">
          <button class="button" :class="{ 'button--busy': copying }" type="button" :disabled="copying" @click="handleCopyShareLink">
            {{ copied ? '已复制' : (copying ? '复制中...' : '复制链接') }}
          </button>
          <button class="button button--ghost" type="button" @click="sharing = null">关闭</button>
        </div>
      </div>
    </div>
  </section>
</template>
