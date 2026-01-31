<script setup lang="ts">
/**
 * @file Collection editor page: create or maintain a collection.
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCollectionDi } from '../../di'
import type { CollectionDetail } from '../../domain/models'

const collectionDi = useCollectionDi()
const route = useRoute()
const router = useRouter()

const name = ref('')
const description = ref('')
const visibility = ref<'PUBLIC' | 'UNLISTED' | 'PRIVATE'>('PUBLIC')
const saving = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const busyAction = ref<'' | 'create' | 'update' | 'add' | 'reorder'>('')

const detail = ref<CollectionDetail | null>(null)
const newProblemId = ref('')
const newSortOrder = ref('')

const collectionId = computed(() => {
  const raw = route.params.id
  if (typeof raw === 'string' && raw.trim()) return raw
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].trim()) return raw[0]
  return null
})

const isEditing = computed(() => collectionId.value !== null)

/**
 * Load collection detail for editing.
 */
async function loadDetail(): Promise<void> {
  if (!isEditing.value || collectionId.value === null) return
  loading.value = true
  errorMessage.value = ''
  try {
    detail.value = await collectionDi.getDetailUseCase.execute(collectionId.value)
    name.value = detail.value.name
    description.value = detail.value.description ?? ''
    visibility.value = detail.value.visibility
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载题单失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

/**
 * Create a new collection.
 */
async function handleCreate(): Promise<void> {
  if (!name.value.trim()) {
    errorMessage.value = '名称为必填。'
    return
  }

  saving.value = true
  busyAction.value = 'create'
  errorMessage.value = ''
  try {
    await collectionDi.createUseCase.execute({
      name: name.value.trim(),
      description: description.value.trim() || null,
      visibility: visibility.value,
    })
    await router.push('/me/collections')
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存题单失败。'
    errorMessage.value = message
  } finally {
    saving.value = false
    if (busyAction.value === 'create') busyAction.value = ''
  }
}

/**
 * Update collection base info.
 */
async function handleUpdate(): Promise<void> {
  if (collectionId.value === null) return
  if (!name.value.trim()) {
    errorMessage.value = '名称为必填。'
    return
  }
  saving.value = true
  busyAction.value = 'update'
  errorMessage.value = ''
  successMessage.value = ''
  try {
    detail.value = await collectionDi.updateUseCase.execute(collectionId.value, {
      name: name.value.trim(),
      description: description.value.trim() || null,
      visibility: visibility.value,
    })
    successMessage.value = '题单信息已保存。'
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存题单失败。'
    errorMessage.value = message
  } finally {
    saving.value = false
    if (busyAction.value === 'update') busyAction.value = ''
  }
}

/**
 * Add a problem to the collection.
 */
async function handleAddItem(): Promise<void> {
  const pid = newProblemId.value.trim()
  if (collectionId.value === null || !pid) {
    errorMessage.value = '题目ID为必填。'
    return
  }
  if (!/^\d+$/.test(pid)) {
    errorMessage.value = '题目ID必须为数字字符串。'
    return
  }
  saving.value = true
  busyAction.value = 'add'
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await collectionDi.addItemUseCase.execute(collectionId.value, {
      problemId: pid,
      sortOrder: newSortOrder.value ? Number(newSortOrder.value) : undefined,
    })
    successMessage.value = '已加入题单。'
    newProblemId.value = ''
    newSortOrder.value = ''
    await loadDetail()
  } catch (error) {
    const message = error instanceof Error ? error.message : '添加题目失败。'
    errorMessage.value = message
  } finally {
    saving.value = false
    if (busyAction.value === 'add') busyAction.value = ''
  }
}

/**
 * Sync current list order with backend.
 */
async function handleReorder(): Promise<void> {
  if (collectionId.value === null || !detail.value?.items?.length) return
  saving.value = true
  busyAction.value = 'reorder'
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const items = detail.value.items.map((item, index) => ({
      problemId: item.problemId,
      sortOrder: item.sortOrder ?? (index + 1) * 10,
    }))
    await collectionDi.reorderItemsUseCase.execute(collectionId.value, { items })
    successMessage.value = '顺序已同步。'
  } catch (error) {
    const message = error instanceof Error ? error.message : '同步顺序失败。'
    errorMessage.value = message
  } finally {
    saving.value = false
    if (busyAction.value === 'reorder') busyAction.value = ''
  }
}

onMounted(() => {
  void loadDetail()
})
</script>

<template>
  <!-- Page: Collection editor -->
  <section class="page page--narrow">
    <header class="page__header">
      <h1 class="page__title">题单编辑</h1>
    </header>
    <div class="card card--stack">
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="helper">{{ successMessage }}</p>
      <p v-if="loading" class="helper">加载中...</p>
      <template v-if="!isEditing">
        <label class="field">
          <span>名称</span>
          <input v-model="name" type="text" placeholder="题单名称" />
        </label>
        <label class="field">
          <span>描述</span>
          <textarea v-model="description" rows="4" placeholder="简短描述"></textarea>
        </label>
        <label class="field">
          <span>可见性</span>
          <select v-model="visibility">
            <option value="PUBLIC">公开</option>
            <option value="UNLISTED">不公开列出</option>
            <option value="PRIVATE">私有</option>
          </select>
        </label>
        <button class="button" :class="{ 'button--busy': busyAction === 'create' }" :disabled="saving" @click="handleCreate">
          {{ busyAction === 'create' ? '保存中...' : '保存题单' }}
        </button>
      </template>
      <template v-else>
        <div class="card card--stack">
          <h2 class="card__title">题单信息</h2>
          <label class="field">
            <span>名称</span>
            <input v-model="name" type="text" placeholder="题单名称" />
          </label>
          <label class="field">
            <span>描述</span>
            <textarea v-model="description" rows="4" placeholder="简短描述"></textarea>
          </label>
          <label class="field">
            <span>可见性</span>
            <select v-model="visibility">
              <option value="PUBLIC">公开</option>
              <option value="UNLISTED">不公开列出</option>
              <option value="PRIVATE">私有</option>
            </select>
          </label>
          <div class="actions">
            <button class="button" :class="{ 'button--busy': busyAction === 'update' }" :disabled="saving" @click="handleUpdate">
              {{ busyAction === 'update' ? '保存中...' : '保存修改' }}
            </button>
            <router-link class="button button--ghost" to="/me/collections">返回列表</router-link>
          </div>
        </div>

        <div class="filters">
          <label class="field">
            <span>题目ID</span>
            <input v-model="newProblemId" type="text" placeholder="1001" />
          </label>
          <label class="field">
            <span>排序</span>
            <input v-model="newSortOrder" type="number" placeholder="可选" />
          </label>
          <button class="button" :class="{ 'button--busy': busyAction === 'add' }" :disabled="saving" @click="handleAddItem">
            {{ busyAction === 'add' ? '添加中...' : '添加题目' }}
          </button>
        </div>
        <button class="button button--ghost" :class="{ 'button--busy': busyAction === 'reorder' }" :disabled="saving" @click="handleReorder">
          {{ busyAction === 'reorder' ? '同步中...' : '同步顺序' }}
        </button>
        <ul v-if="detail?.items?.length" class="list">
          <li v-for="item in detail.items" :key="item.problemId" class="list__item">
            <div>
              <strong>{{ item.problem?.title || `题目 ${item.problemId}` }}</strong>
              <p class="helper">排序：{{ item.sortOrder ?? '-' }}</p>
            </div>
            <router-link class="link" :to="`/problems/${item.problemId}`">查看</router-link>
          </li>
        </ul>
        <p v-else class="helper">该题单暂无题目。</p>
      </template>
    </div>
  </section>
</template>
