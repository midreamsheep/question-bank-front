<script setup lang="ts">
/**
 * @file Admin categories page: manage category hierarchy.
 */
import { onMounted, ref } from 'vue'
import { useAdminDi } from '../../di'
import type { Category } from '../../domain/models'

const adminDi = useAdminDi()

const loading = ref(false)
const errorMessage = ref('')
const categories = ref<Category[]>([])

const name = ref('')
const parentId = ref('')
const subject = ref('')
const saving = ref(false)
const updateId = ref('')
const updateName = ref('')
const updateParentId = ref('')
const updateSubject = ref('')

/**
 * Format a subject code for display.
 * @param value - Subject code.
 * @returns Display label.
 */
function formatSubject(value?: string | null): string {
  if (!value) return '全部'
  if (value === 'MATH') return '数学'
  if (value === 'PHYSICS') return '物理'
  return value
}

/**
 * Load categories list.
 */
async function loadCategories(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    categories.value = await adminDi.listCategoriesUseCase.execute()
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载分类失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

/**
 * Create a new category.
 */
async function handleCreate(): Promise<void> {
  if (!name.value.trim()) {
    errorMessage.value = '名称为必填。'
    return
  }
  saving.value = true
  errorMessage.value = ''
  try {
    await adminDi.createCategoryUseCase.execute({
      name: name.value.trim(),
      parentId: parentId.value ? Number(parentId.value) : null,
      subject: subject.value || null,
    })
    name.value = ''
    parentId.value = ''
    subject.value = ''
    await loadCategories()
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建分类失败。'
    errorMessage.value = message
  } finally {
    saving.value = false
  }
}

/**
 * Update an existing category.
 */
async function handleUpdate(): Promise<void> {
  if (!updateId.value) {
    errorMessage.value = '更新需要分类ID。'
    return
  }
  saving.value = true
  errorMessage.value = ''
  try {
    await adminDi.updateCategoryUseCase.execute(Number(updateId.value), {
      name: updateName.value.trim() || undefined,
      parentId: updateParentId.value ? Number(updateParentId.value) : undefined,
      subject: updateSubject.value || undefined,
    })
    updateId.value = ''
    updateName.value = ''
    updateParentId.value = ''
    updateSubject.value = ''
    await loadCategories()
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新分类失败。'
    errorMessage.value = message
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadCategories()
})
</script>

<template>
  <!-- Page: Admin categories -->
  <section class="page">
    <header class="page__header">
      <h1 class="page__title">分类管理</h1>
    </header>
    <div class="card card--stack">
      <div class="filters">
        <label class="field">
          <span>名称</span>
          <input v-model="name" type="text" placeholder="分类名称" />
        </label>
        <label class="field">
          <span>父级ID</span>
          <input v-model="parentId" type="number" placeholder="可选" />
        </label>
        <label class="field">
          <span>学科</span>
          <select v-model="subject">
            <option value="">全部</option>
            <option value="MATH">数学</option>
            <option value="PHYSICS">物理</option>
          </select>
        </label>
        <button class="button" :class="{ 'button--busy': saving }" :disabled="saving" @click="handleCreate">
          {{ saving ? '新增中...' : '新增' }}
        </button>
      </div>
      <div class="filters">
        <label class="field">
          <span>更新ID</span>
          <input v-model="updateId" type="number" placeholder="分类ID" />
        </label>
        <label class="field">
          <span>更新名称</span>
          <input v-model="updateName" type="text" placeholder="可选" />
        </label>
        <label class="field">
          <span>更新父级ID</span>
          <input v-model="updateParentId" type="number" placeholder="可选" />
        </label>
        <label class="field">
          <span>更新学科</span>
          <select v-model="updateSubject">
            <option value="">保持</option>
            <option value="MATH">数学</option>
            <option value="PHYSICS">物理</option>
          </select>
        </label>
        <button class="button button--ghost" :class="{ 'button--busy': saving }" :disabled="saving" @click="handleUpdate">
          {{ saving ? '更新中...' : '更新' }}
        </button>
      </div>
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-else-if="loading" class="helper">加载中...</p>
      <template v-else>
        <ul v-if="categories.length" class="list">
          <li v-for="item in categories" :key="item.id" class="list__item">
            <div>
              <strong>{{ item.name }}</strong>
              <p class="helper">ID {{ item.id }} · 父级 {{ item.parentId ?? '-' }} · {{ formatSubject(item.subject) }}</p>
            </div>
          </li>
        </ul>
        <p v-else class="helper">暂无分类。</p>
      </template>
    </div>
  </section>
</template>
