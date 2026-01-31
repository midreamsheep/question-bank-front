<script setup lang="ts">
/**
 * @file Admin problem types page: manage problem types.
 */
import { onMounted, ref } from 'vue'
import { useAdminDi } from '../../di'
import type { ProblemType } from '../../domain/models'

const adminDi = useAdminDi()

const loading = ref(false)
const errorMessage = ref('')
const types = ref<ProblemType[]>([])

const name = ref('')
const subject = ref('')
const saving = ref(false)
const updateId = ref('')
const updateName = ref('')
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
 * Load problem types list.
 */
async function loadTypes(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    types.value = await adminDi.listProblemTypesUseCase.execute()
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载题型失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

/**
 * Create a new problem type.
 */
async function handleCreate(): Promise<void> {
  if (!name.value.trim()) {
    errorMessage.value = '名称为必填。'
    return
  }
  saving.value = true
  errorMessage.value = ''
  try {
    await adminDi.createProblemTypeUseCase.execute({
      name: name.value.trim(),
      subject: subject.value || null,
    })
    name.value = ''
    subject.value = ''
    await loadTypes()
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建题型失败。'
    errorMessage.value = message
  } finally {
    saving.value = false
  }
}

/**
 * Update an existing problem type.
 */
async function handleUpdate(): Promise<void> {
  if (!updateId.value) {
    errorMessage.value = '更新需要题型ID。'
    return
  }
  saving.value = true
  errorMessage.value = ''
  try {
    await adminDi.updateProblemTypeUseCase.execute(Number(updateId.value), {
      name: updateName.value.trim() || undefined,
      subject: updateSubject.value || undefined,
    })
    updateId.value = ''
    updateName.value = ''
    updateSubject.value = ''
    await loadTypes()
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新题型失败。'
    errorMessage.value = message
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadTypes()
})
</script>

<template>
  <!-- Page: Admin problem types -->
  <section class="page">
    <header class="page__header">
      <h1 class="page__title">题型管理</h1>
    </header>
    <div class="card card--stack">
      <div class="filters">
        <label class="field">
          <span>名称</span>
          <input v-model="name" type="text" placeholder="题型名称" />
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
          <input v-model="updateId" type="number" placeholder="题型ID" />
        </label>
        <label class="field">
          <span>更新名称</span>
          <input v-model="updateName" type="text" placeholder="可选" />
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
        <ul v-if="types.length" class="list">
          <li v-for="item in types" :key="item.id" class="list__item">
            <div>
              <strong>{{ item.name }}</strong>
              <p class="helper">ID {{ item.id }} · {{ formatSubject(item.subject) }}</p>
            </div>
          </li>
        </ul>
        <p v-else class="helper">暂无题型。</p>
      </template>
    </div>
  </section>
</template>
